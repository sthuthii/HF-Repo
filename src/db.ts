import "dotenv/config";

// src/db.ts
import Database from "better-sqlite3";

const db = new Database(".repomap/db.sqlite");

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