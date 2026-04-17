import "dotenv/config";

import db from "./db";

interface FileRow {
  id: number;
  path: string;
  purpose: string;
  layer: string;
  importance: number;
  raw_content: string;
}

export function getSummary() {
  const files = db.prepare("SELECT * FROM files").all() as FileRow[];

  return `
Repo contains ${files.length} files.
Main components:
${files.slice(0, 5).map(f => `- ${f.path}: ${f.purpose}`).join("\n")}
  `;
}