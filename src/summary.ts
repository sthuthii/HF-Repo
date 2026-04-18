import "dotenv/config";

import { DEFAULT_REPO, getFilesByRepo } from "./db";

interface FileRow {
  path: string;
  purpose: string;
  layer: string;
  importance: number;
}

// NEW: multi-repo support
function normalizeRepoName(repo?: string | null) {
  const trimmed = repo?.trim();
  return trimmed ? trimmed : DEFAULT_REPO;
}

export function getSummary(repo?: string) {
  const files = getFilesByRepo(normalizeRepoName(repo)) as FileRow[];

  return {
    total: files.length,
    topFiles: files
      .slice()
      .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
      .slice(0, 5)
      .map(f => ({
      path: f.path,
      purpose: f.purpose,
      importance: f.importance
    }))
  };
}

export function getAllFiles(repo?: string) {
  const files = getFilesByRepo(normalizeRepoName(repo)) as FileRow[];

  return {
    total: files.length,
    files: files
      .slice()
      .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
      .map(f => ({
      path: f.path,
      purpose: f.purpose,
      importance: f.importance
    }))
  };
}
