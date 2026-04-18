import "dotenv/config";

import { DEFAULT_REPO, getFilesByRepo } from "./db";

// NEW: multi-repo support
function normalizeRepoName(repo?: string | null) {
  const trimmed = repo?.trim();
  return trimmed ? trimmed : DEFAULT_REPO;
}

export function listFiles(repo?: string) {
  return (getFilesByRepo(normalizeRepoName(repo)) as Array<{
    path: string;
    purpose: string;
    importance: number;
  }>).sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0));
}
