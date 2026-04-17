import "dotenv/config";

import db from "./db";

export function listFiles() {
  return db.prepare(`
    SELECT path, purpose, importance FROM files
    ORDER BY importance DESC
  `).all();
}