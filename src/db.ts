import "dotenv/config";

import fs from "fs";
import initSqlJs from "sql.js";

export let db: any;

// NEW: multi-repo support
export const DEFAULT_REPO = "default";

interface FileRecordInput {
  repo: string;
  path: string;
  raw_content: string;
}

interface FileMetadataUpdate {
  repo: string;
  path: string;
  purpose: string;
  layer: string;
  importance: number;
  embedding: string;
}

function normalizeRepoName(repo?: string | null) {
  const trimmed = repo?.trim();
  return trimmed ? trimmed : DEFAULT_REPO;
}

function runSafely(sql: string) {
  try {
    db.run(sql);
  } catch {
    // Migration already applied or not needed.
  }
}

function statementResultsToRecords(statement: any) {
  const records: Array<Record<string, any>> = [];

  while (statement.step()) {
    records.push(statement.getAsObject());
  }

  return records;
}

export async function initDB() {
  const SQL = await initSqlJs();
  let buffer: Buffer | null;
  try {
    buffer = fs.readFileSync(".repomap/db.sqlite");
  } catch {
    buffer = null;
  }

  db = new SQL.Database(buffer);

  db.run(`
    CREATE TABLE IF NOT EXISTS repo (
      path TEXT,
      name TEXT,
      summary TEXT,
      stack TEXT,
      cloned_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY,
      repo TEXT,
      path TEXT,
      purpose TEXT,
      layer TEXT,
      importance INTEGER,
      raw_content TEXT,
      embedding TEXT
    );

    CREATE TABLE IF NOT EXISTS qa_cache (
      id INTEGER PRIMARY KEY,
      repo TEXT,
      question TEXT,
      answer TEXT
    );
  `);

  // NEW: multi-repo support migrations
  runSafely(`ALTER TABLE files ADD COLUMN repo TEXT;`);
  runSafely(`ALTER TABLE files ADD COLUMN embedding TEXT;`);
  runSafely(`ALTER TABLE qa_cache ADD COLUMN repo TEXT;`);
  runSafely(`ALTER TABLE qa_cache ADD COLUMN id INTEGER;`);

  db.run(`UPDATE files SET repo = ? WHERE repo IS NULL OR repo = ''`, [DEFAULT_REPO]);
  db.run(`UPDATE qa_cache SET repo = ? WHERE repo IS NULL OR repo = ''`, [DEFAULT_REPO]);
}

export function saveDB() {
  if (!db) {
    return;
  }

  fs.mkdirSync(".repomap", { recursive: true });
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(".repomap/db.sqlite", buffer);
}

export function query(sql: string, params: any[] = []) {
  if (!db) {
    throw new Error("Database not initialized");
  }

  const statement = db.prepare(sql);

  try {
    if (params.length > 0) {
      statement.bind(params);
    }

    return statementResultsToRecords(statement);
  } finally {
    statement.free();
  }
}

// NEW: multi-repo support
export function getFilesByRepo(repo?: string | null) {
  return query(
    `
      SELECT path, purpose, importance, layer, raw_content, embedding
      FROM files
      WHERE repo = ?
    `,
    [normalizeRepoName(repo)]
  );
}

// NEW: multi-repo support
export function getPendingFilesByRepo(repo?: string | null) {
  return query(
    `
      SELECT path, raw_content
      FROM files
      WHERE repo = ? AND embedding IS NULL
    `,
    [normalizeRepoName(repo)]
  );
}

// NEW: multi-repo support
export function insertFile(file: FileRecordInput) {
  const statement = db.prepare(`
    INSERT OR REPLACE INTO files (repo, path, raw_content)
    VALUES (?, ?, ?)
  `);

  try {
    statement.bind([normalizeRepoName(file.repo), file.path, file.raw_content]);
    statement.step();
  } finally {
    statement.free();
  }
}

// NEW: multi-repo support
export function updateFileMetadata(file: FileMetadataUpdate) {
  const statement = db.prepare(`
    UPDATE files
    SET purpose = ?, layer = ?, importance = ?, embedding = ?
    WHERE repo = ? AND path = ?
  `);

  try {
    statement.bind([
      file.purpose,
      file.layer,
      file.importance,
      file.embedding,
      normalizeRepoName(file.repo),
      file.path,
    ]);
    statement.step();
  } finally {
    statement.free();
  }
}

// NEW: multi-repo support
export function clearRepoData(repo?: string | null) {
  const repoName = normalizeRepoName(repo);
  db.run(`DELETE FROM files WHERE repo = ?`, [repoName]);
  db.run(`DELETE FROM qa_cache WHERE repo = ?`, [repoName]);
  db.run(`DELETE FROM repo WHERE name = ?`, [repoName]);
}

// NEW: multi-repo support
export function saveRepoRecord(repo?: string | null, repoPath?: string | null) {
  const repoName = normalizeRepoName(repo);

  db.run(`DELETE FROM repo WHERE name = ?`, [repoName]);

  const statement = db.prepare(`
    INSERT INTO repo (path, name, cloned_at) VALUES (?, ?, datetime('now'))
  `);

  try {
    statement.bind([repoPath ?? "", repoName]);
    statement.step();
  } finally {
    statement.free();
  }
}

// NEW: multi-repo support
export function getCachedAnswer(repo: string | null | undefined, question: string) {
  const rows = query(
    `
      SELECT answer
      FROM qa_cache
      WHERE repo = ? AND question = ?
      LIMIT 1
    `,
    [normalizeRepoName(repo), question]
  );

  return rows[0]?.answer ?? null;
}

// NEW: multi-repo support
export function saveAnswer(repo: string | null | undefined, question: string, answer: string) {
  const repoName = normalizeRepoName(repo);

  db.run(`DELETE FROM qa_cache WHERE repo = ? AND question = ?`, [repoName, question]);

  const statement = db.prepare(`
    INSERT INTO qa_cache (repo, question, answer) VALUES (?, ?, ?)
  `);

  try {
    statement.bind([repoName, question, answer]);
    statement.step();
  } finally {
    statement.free();
  }
}
