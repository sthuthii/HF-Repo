import path from "path";

export interface FileAnalysis {
  purpose: string;
  layer: "core" | "api" | "utils" | "tests" | "config";
  importance: number;
}

const FALLBACK_EMBEDDING_DIMENSIONS = 64;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function tokenize(text: string) {
  return (text.toLowerCase().match(/[a-z0-9_]+/g) ?? []).filter(Boolean);
}

function inferLayer(filePath: string, content: string): FileAnalysis["layer"] {
  const normalizedPath = filePath.replace(/\\/g, "/").toLowerCase();
  const lowerContent = content.toLowerCase();

  if (
    normalizedPath.includes("/test") ||
    normalizedPath.includes("/tests/") ||
    normalizedPath.includes(".spec.") ||
    normalizedPath.includes(".test.")
  ) {
    return "tests";
  }

  if (
    normalizedPath.endsWith(".json") ||
    normalizedPath.endsWith(".env") ||
    normalizedPath.endsWith(".yml") ||
    normalizedPath.endsWith(".yaml") ||
    normalizedPath.endsWith(".toml") ||
    normalizedPath.endsWith(".ini") ||
    normalizedPath.includes("config")
  ) {
    return "config";
  }

  if (
    normalizedPath.includes("/api/") ||
    normalizedPath.includes("/routes/") ||
    normalizedPath.includes("/controllers/") ||
    lowerContent.includes("express.") ||
    lowerContent.includes("router.") ||
    lowerContent.includes("app.get(") ||
    lowerContent.includes("app.post(")
  ) {
    return "api";
  }

  if (
    normalizedPath.includes("/utils/") ||
    normalizedPath.includes("/helpers/") ||
    normalizedPath.includes("/lib/") ||
    lowerContent.includes("export function") ||
    lowerContent.includes("module.exports")
  ) {
    return "utils";
  }

  return "core";
}

function inferImportance(filePath: string, content: string, layer: FileAnalysis["layer"]) {
  const normalizedPath = filePath.replace(/\\/g, "/").toLowerCase();
  let score = 3;

  if (layer === "tests" || layer === "config") score -= 1;
  if (normalizedPath.includes("/src/")) score += 1;
  if (normalizedPath.includes("index") || normalizedPath.includes("main") || normalizedPath.includes("server")) score += 1;
  if (content.length > 4000) score += 1;

  return clamp(score, 1, 5);
}

function buildPurpose(filePath: string, content: string, layer: FileAnalysis["layer"]) {
  const parsed = path.parse(filePath);
  const baseName = parsed.name.replace(/[._-]+/g, " ").trim();
  const prettyName = baseName ? baseName.charAt(0).toUpperCase() + baseName.slice(1) : "This file";
  const lowerContent = content.toLowerCase();

  if (layer === "tests") {
    return `${prettyName} contains automated tests for related repository behavior.`;
  }

  if (layer === "config") {
    return `${prettyName} defines configuration or environment settings used by the project.`;
  }

  if (lowerContent.includes("class ")) {
    return `${prettyName} defines core class-based logic used by this part of the project.`;
  }

  if (lowerContent.includes("function ") || lowerContent.includes("=>")) {
    return `${prettyName} implements functional logic for this part of the project.`;
  }

  return `${prettyName} provides source code used by this part of the project.`;
}

export function fallbackAnalyseFile(filePath: string, content: string): FileAnalysis {
  const layer = inferLayer(filePath, content);

  return {
    purpose: buildPurpose(filePath, content, layer),
    layer,
    importance: inferImportance(filePath, content, layer),
  };
}

function hashToken(token: string) {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function fallbackEmbedding(text: string) {
  const vector = new Array(FALLBACK_EMBEDDING_DIMENSIONS).fill(0);
  const tokens = tokenize(text);

  if (tokens.length === 0) {
    return vector;
  }

  for (const token of tokens) {
    const hash = hashToken(token);
    const index = hash % FALLBACK_EMBEDDING_DIMENSIONS;
    const sign = ((hash >>> 1) & 1) === 0 ? 1 : -1;
    vector[index] += sign;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

export function fallbackAnswer(question: string, files: Array<{ path: string; purpose: string }>) {
  const queryTokens = new Set(tokenize(question));
  const ranked = files
    .map((file) => {
      const haystack = `${file.path} ${file.purpose}`.toLowerCase();
      let score = 0;
      for (const token of queryTokens) {
        if (haystack.includes(token)) score++;
      }
      return { ...file, score };
    })
    .filter((file) => file.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (ranked.length === 0) {
    return "Gemini is unavailable, and I could not find a confident answer from the indexed file summaries alone.";
  }

  const lines = ranked.map((file) => `- ${file.path}: ${file.purpose}`);
  return [
    "Gemini is unavailable, so this answer is based on indexed file summaries.",
    ...lines,
  ].join("\n");
}
