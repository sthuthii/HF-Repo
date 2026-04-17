import "dotenv/config";

import { execSync } from "child_process";
import fs from "fs";
import db, { initDB } from "./db";
import { walk } from "./walker";
import { analyseFile } from "./analyser";

export async function initRepo(url: string) {
  initDB();

  const repoName = url.split("/").pop()?.replace(".git", "");
  const repoPath = `.repomap/${repoName}`;

  execSync(`git clone ${url} ${repoPath}`);

  const files = walk(repoPath);

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");

    const meta = await analyseFile(content);

    db.prepare(`
      INSERT INTO files (path, purpose, layer, importance, raw_content)
      VALUES (?, ?, ?, ?, ?)
    `).run(file, meta.purpose, meta.layer, meta.importance, content);
  }

  db.prepare(`
    INSERT INTO repo (path, name, cloned_at)
    VALUES (?, ?, datetime('now'))
  `).run(repoPath, repoName);
}