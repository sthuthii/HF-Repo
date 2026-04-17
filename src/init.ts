import "dotenv/config";
import fs from "fs";
import path from "path";
import db from "./db";
import { walk } from "./walker";
import { analyseFile } from "./analyser";
import { generateEmbedding } from "./embeddings";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function initRepo(urlOrPath: string) {
  console.log(`\n🚀 Initializing Semantic Indexer: ${urlOrPath}`);
  
  const repoPath = path.resolve(urlOrPath);
  const allFiles = walk(repoPath);

  console.log(`📝 Registering files...`);
  const registerStmt = db.prepare(`INSERT OR IGNORE INTO files (path, raw_content) VALUES (?, ?)`);
  
  db.transaction((fileList: string[]) => {
    for (const file of fileList) {
      const fileName = path.basename(file);
      if (
        file.includes("node_modules") || file.includes(".git") || 
        file.includes(".repomap") || fileName === "package-lock.json" ||
        fileName === "yarn.lock" || fileName === ".env"
      ) continue;
      registerStmt.run(file, fs.readFileSync(file, "utf-8"));
    }
  })(allFiles);

  const pending = db.prepare("SELECT path, raw_content FROM files WHERE embedding IS NULL").all() as any[];
  console.log(`🧠 ${pending.length} files to vectorize.`);

  for (let i = 0; i < pending.length; i++) {
    const file = pending[i];
    const relPath = path.relative(repoPath, file.path);
    try {
      console.log(`[${i + 1}/${pending.length}] Processing: ${relPath}`);
      
      const meta = await analyseFile(file.raw_content);
      const vector = await generateEmbedding(meta.purpose);

      db.prepare(`UPDATE files SET purpose=?, layer=?, importance=?, embedding=? WHERE path=?`)
        .run(meta.purpose, meta.layer, meta.importance, JSON.stringify(vector), file.path);

      console.log(`   ✨ Success saved.`);
      await delay(6000); // 6s gap between successful calls
    } catch (err: any) {
      if (err.message.includes("429")) {
        const wait = 40000 + Math.random() * 5000;
        console.log(`   ⚠️ Rate Limit. Waiting ${Math.round(wait/1000)}s...`);
        await delay(wait);
        i--; // Retry
      } else {
        console.log(`   ❌ Failed: ${relPath}. Marking as SKIPPED.`);
        db.prepare(`UPDATE files SET embedding = 'SKIPPED' WHERE path = ?`).run(file.path);
      }
    }
  }
  console.log("✅ Indexing Complete.");
}

initRepo(process.argv[2] || ".").catch(console.error);