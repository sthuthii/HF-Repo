import "dotenv/config";

import path from "path";

import { DEFAULT_REPO, getFilesByRepo, getRepoPath } from "./db";

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
  }>)
    .map((file) => ({
      path: file.path,
      purpose: file.purpose,
      importance: file.importance,
    }))
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0));
}

function toDisplayPath(filePath: string, repoPath: string | null) {
  if (!repoPath) {
    return filePath;
  }

  const relativePath = path.relative(repoPath, filePath);
  return relativePath && !relativePath.startsWith("..") ? relativePath : filePath;
}

function formatPurpose(purpose: string | null | undefined, width = 88) {
  const text = purpose?.trim() || "No purpose available.";
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > width && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join("\n    ");
}

export function formatFilesOutput(repo?: string) {
  const repoName = normalizeRepoName(repo);
  const files = listFiles(repoName);
  const repoPath = getRepoPath(repoName);

  if (files.length === 0) {
    return `No indexed files found for repo "${repoName}".`;
  }

  return [
    `Indexed files for repo "${repoName}" (${files.length})`,
    ...files.map((file, index) => {
      const displayPath = toDisplayPath(file.path, repoPath);
      const importance = file.importance ?? 0;
      const purpose = formatPurpose(file.purpose);
      return `${index + 1}. [${importance}] ${displayPath}\n    ${purpose}`;
    }),
  ].join("\n\n");
}
