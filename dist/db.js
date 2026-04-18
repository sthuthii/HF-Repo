"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDB = initDB;
require("dotenv/config");
const fs_1 = __importDefault(require("fs")); // <--- MAKE SURE fs IS IMPORTED
const path_1 = __importDefault(require("path"));
// src/db.ts
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const dbDir = path_1.default.join(process.cwd(), ".repomap");
if (!fs_1.default.existsSync(dbDir)) {
    fs_1.default.mkdirSync(dbDir, { recursive: true });
}
// ----------------------------------------------
const db = new better_sqlite3_1.default(".repomap/db.sqlite");
try {
    db.exec("ALTER TABLE files ADD COLUMN primary_role TEXT");
}
catch (e) { }
try {
    db.exec("ALTER TABLE files ADD COLUMN role_scores TEXT");
}
catch (e) { }
try {
    db.exec("ALTER TABLE files ADD COLUMN dependencies TEXT");
}
catch (e) { }
function initDB() {
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
exports.default = db;
//# sourceMappingURL=db.js.map