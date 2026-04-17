import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.resolve(process.cwd(), ".repomap");
const DB_PATH = path.join(DB_DIR, "db.sqlite");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Crucial: Allows reading while writing

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE,
      purpose TEXT,
      layer TEXT,
      importance TEXT,
      raw_content TEXT,
      embedding TEXT
    );
  `);
}

initDB();
export default db;