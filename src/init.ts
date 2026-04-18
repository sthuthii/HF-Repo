import "dotenv/config";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import {
  clearRepoData,
  getPendingFilesByRepo,
  initDB,
  insertFile,
  saveDB,
  saveRepoRecord,
  updateFileMetadata,
  DEFAULT_REPO,
} from "./db";
import { walk } from "./walker";
import { analyseFile } from "./analyser";
import { generateEmbedding } from "./embeddings";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const ANALYSIS_COOLDOWN_MS = 8000;
const RATE_LIMIT_BASE_DELAY_MS = 60000;
const RATE_LIMIT_MAX_RETRIES = 5;
const IGNORE = [
  "node_modules",
  ".git",
  ".repomap",
  "dist",
  "build",
  "__pycache__",
  "venv",
  "env",
  ".ipynb_checkpoints"
];

function isGitUrl(value: string) {
  return /^(https?:\/\/|git@|ssh:\/\/)/.test(value) || value.endsWith(".git");
}

// NEW: multi-repo support
function resolveRepoName(urlOrPath: string, explicitRepoName?: string) {
  const trimmed = explicitRepoName?.trim();
  if (trimmed) {
    return trimmed;
  }

  return DEFAULT_REPO;
}

export async function initRepo(urlOrPath: string, explicitRepoName?: string) {
  const repoName = resolveRepoName(urlOrPath, explicitRepoName);
  console.log(`\nInitializing Semantic Indexer: ${urlOrPath}`);
  console.log(`Repository scope: ${repoName}`);

  await initDB();

  let repoPath: string;

  if (isGitUrl(urlOrPath)) {
    const cloneDirName = repoName === DEFAULT_REPO
      ? urlOrPath.split("/").pop()?.replace(/\.git$/, "") || "repo"
      : repoName;
    repoPath = path.resolve(".repomap", "repos", cloneDirName);
  } else {
    repoPath = path.resolve(urlOrPath);
  }

  console.log(`Refreshing data for repo scope "${repoName}"...`);
  clearRepoData(repoName);
  saveDB();

  if (isGitUrl(urlOrPath)) {
    fs.mkdirSync(path.dirname(repoPath), { recursive: true });

    if (!fs.existsSync(repoPath)) {
      console.log(`Cloning ${urlOrPath} into ${repoPath}`);
      execSync(`git clone ${urlOrPath} ${repoPath}`, { stdio: "inherit" });
    } else {
      console.log(`Reusing existing clone at ${repoPath}`);
    }
  } else if (!fs.existsSync(repoPath) || !fs.statSync(repoPath).isDirectory()) {
    throw new Error(`Repository path not found: ${repoPath}`);
  }

  const files = walk(repoPath);

  console.log(`Registering ${files.length} files to database...`);

  let insertCount = 0;
  dbLoop:
  for (const file of files) {
    const fileName = path.basename(file);
    const isNodeModule = file.includes(path.sep + "node_modules" + path.sep);
    const isGit = file.includes(path.sep + ".git" + path.sep);
    const isEnv = fileName === ".env";
    const isSqlite = fileName.endsWith(".sqlite");
    const isPng = fileName.endsWith(".png");

    if (isNodeModule || isGit || isEnv || isSqlite || isPng) {
      console.log(`  Skipping: ${file}`);
      continue dbLoop;
    }

    const content = fs.readFileSync(file, "utf-8");
    insertFile({
      repo: repoName,
      path: file,
      raw_content: content,
    });
    insertCount++;
    console.log(`  Inserted: ${file}`);
  }

  saveDB();
  console.log(`Registration complete. Inserted ${insertCount}/${files.length} files.`);

  console.log(`Starting AI Analysis & Vectorization...`);

  const pendingFiles = getPendingFilesByRepo(repoName) as Array<{ path: string; raw_content: string }>;
  console.log(`Found ${pendingFiles.length} files pending analysis.`);
  const retryCounts = new Map<string, number>();

  for (let i = 0; i < pendingFiles.length; i++) {
    const file = pendingFiles[i];
    const relativePath = path.relative(repoPath, file.path);

    try {
      console.log(`[${i + 1}/${pendingFiles.length}] Processing: ${relativePath}...`);

      const meta = await analyseFile(file.raw_content, file.path);
      const vector = await generateEmbedding(meta.purpose);

      updateFileMetadata({
        repo: repoName,
        path: file.path,
        purpose: meta.purpose,
        layer: meta.layer,
        importance: meta.importance,
        embedding: JSON.stringify(vector),
      });

      saveDB();
      console.log(`   Success: Vector stored.`);
      retryCounts.delete(file.path);
      await delay(ANALYSIS_COOLDOWN_MS);
    } catch (err: any) {
      if (String(err?.message ?? "").includes("429")) {
        const retries = (retryCounts.get(file.path) ?? 0) + 1;
        retryCounts.set(file.path, retries);

        if (retries > RATE_LIMIT_MAX_RETRIES) {
          console.error(`   Skipping ${relativePath} after ${RATE_LIMIT_MAX_RETRIES} rate limit retries.`);
          continue;
        }

        const cooldownMs = RATE_LIMIT_BASE_DELAY_MS * retries;
        console.error(
          `   Rate limit hit on ${relativePath}. Cooling down for ${Math.round(
            cooldownMs / 1000
          )}s before retry ${retries}/${RATE_LIMIT_MAX_RETRIES}...`
        );
        await delay(cooldownMs);
        i--;
      } else {
        console.error(`   Error on ${relativePath}: ${err.message}`);
      }
    }
  }

  // NEW: multi-repo support
  saveRepoRecord(repoName, repoPath);
  saveDB();

  console.log(`\nSemantic Indexing Finished for repo "${repoName}".`);
}

if (typeof require !== "undefined" && require.main === module) {
  const inputArg = process.argv[2];
  if (!inputArg) {
    console.error("Usage: ts-node src/init.ts <local-path|git-url> [repo-name]");
    process.exit(1);
  }

  initRepo(inputArg, process.argv[3]).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
