import "dotenv/config";
import fs from "fs"; // <--- MAKE SURE fs IS IMPORTED
import path from "path";
// src/db.ts
import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";

const dbDir = path.join(process.cwd(), ".repomap");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
// ----------------------------------------------
const db: InstanceType<typeof Database> = new Database(".repomap/db.sqlite");



try { db.exec("ALTER TABLE files ADD COLUMN primary_role TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE files ADD COLUMN role_scores TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE files ADD COLUMN dependencies TEXT"); } catch(e) {}

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS repo (
      path TEXT,
      name TEXT,
      summary TEXT,
      stack TEXT,
      cloned_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY,
      path TEXT,
      purpose TEXT,
      layer TEXT,
      importance INTEGER,
      raw_content TEXT
    );
    
      CREATE TABLE IF NOT EXISTS qa_cache (
      question TEXT,
      answer TEXT
    );
  `);
}

export default db;