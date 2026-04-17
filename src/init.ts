import "dotenv/config";
import fs from "fs";
import path from "path";
import db, { initDB } from "./db";
import { walk } from "./walker";
import { analyseFile } from "./analyser";
import { generateEmbedding } from "./embeddings";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function initRepo(urlOrPath: string) {
  // Clear the terminal for a professional demo look
  console.clear();
  console.log(`🚀 Initializing Semantic Indexer: ${urlOrPath}`);
  initDB();

  const repoPath = path.resolve(urlOrPath);
  const files = walk(repoPath);

  // --- PHASE 1: REGISTRATION ---
  console.log(`\n📝 Registering files to SQLite...`);
  
  const registerStmt = db.prepare(`
    INSERT OR IGNORE INTO files (path, raw_content) VALUES (?, ?)
  `);

  const registerAll = db.transaction((fileList: string[]) => {
    for (const file of fileList) {
      const fileName = path.basename(file);
      // Enhanced Filter: Skip binaries and secrets
      if (
        file.includes("node_modules") || 
        file.includes(".git") || 
        file.includes(".repomap") || 
        fileName === ".env" ||
        fileName.endsWith(".sqlite") || 
        fileName.endsWith(".png") ||
        fileName === "package-lock.json"
      ) continue;

      try {
        const content = fs.readFileSync(file, "utf-8");
        registerStmt.run(file, content);
      } catch (e) {
        // Silently skip if file is unreadable (binary/locked)
      }
    }
  });

  registerAll(files);
  console.log(`✅ Registration Complete.`);

  // --- PHASE 2: SEMANTIC ENRICHMENT ---
  console.log(`🧠 Starting AI Vectorization (Phase 2)...`);

  const pendingFiles = db.prepare("SELECT path, raw_content FROM files WHERE embedding IS NULL").all() as any[];
  console.log(`📊 Found ${pendingFiles.length} files to analyze.`);

  for (let i = 0; i < pendingFiles.length; i++) {
    const file = pendingFiles[i];
    const relativePath = path.relative(process.cwd(), file.path);

    try {
      console.log(`[${i + 1}/${pendingFiles.length}] Vectorizing: ${relativePath}...`);

      // Call 1: Extract purpose using Gemini 1.5 Flash
      const meta = await analyseFile(file.raw_content);
      
      // Call 2: Generate Vector using embedding-001
      const vector = await generateEmbedding(meta.purpose);

      // Save everything back to SQLite
      db.prepare(`
        UPDATE files 
        SET purpose = ?, layer = ?, importance = ?, embedding = ? 
        WHERE path = ?
      `).run(meta.purpose, meta.layer, meta.importance, JSON.stringify(vector), file.path);

      console.log(`   ✨ Success: Embedded.`);
      
      // 10s delay to safely stay under the Free Tier TPM limits
      await delay(10000);

    } catch (err: any) {
      if (err.message.includes("429")) {
        console.error(`   ⚠️  Rate Limit hit. Cooling down for 45s...`);
        await delay(45000);
        i--; // Retry the same file
      } else {
        console.error(`   ❌ Failed: ${err.message}`);
        // Optionally mark as SKIPPED so the loop doesn't get stuck forever
        db.prepare(`UPDATE files SET embedding = 'SKIPPED' WHERE path = ?`).run(file.path);
      }
    }
  }

  console.log(`\n✅ Semantic Indexing Finished! You can now run 'ask.ts'.`);
}

const inputArg = process.argv[2];
if (inputArg) {
  initRepo(inputArg).catch(console.error);
}