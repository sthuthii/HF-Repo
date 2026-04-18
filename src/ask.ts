import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fallbackAnswer } from "./aiFallbacks";
import {
  DEFAULT_REPO,
  getCachedAnswer,
  getFilesByRepo,
  saveAnswer,
  saveDB,
} from "./db";
import { generateEmbedding } from "./embeddings";

interface FileSummary {
  path: string;
  purpose: string;
  embedding: string | null;
}

interface RankedFile {
  path: string;
  purpose: string;
  score: number;
}

const TOP_K_RESULTS = 5;

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI
  ? genAI.getGenerativeModel(
      { model: process.env.GEMINI_QA_MODEL ?? "gemini-2.5-flash-lite" },
      { apiVersion: "v1" }
    )
  : null;

// NEW: multi-repo support
function normalizeRepoName(repo?: string | null) {
  const trimmed = repo?.trim();
  return trimmed ? trimmed : DEFAULT_REPO;
}

function shouldUseFallback(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("403") ||
    normalized.includes("404") ||
    normalized.includes("429") ||
    normalized.includes("denied access") ||
    normalized.includes("not found") ||
    normalized.includes("is not supported for generatecontent") ||
    normalized.includes("quota exceeded") ||
    normalized.includes("too many requests") ||
    normalized.includes("rate limit") ||
    normalized.includes("fetch failed") ||
    normalized.includes("econnreset") ||
    normalized.includes("enotfound") ||
    normalized.includes("timed out")
  );
}

function normalizeQuestion(q: string) {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

function cosineSimilarity(a: number[], b: number[]) {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    const valueA = a[i];
    const valueB = b[i];

    dotProduct += valueA * valueB;
    magnitudeA += valueA * valueA;
    magnitudeB += valueB * valueB;
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

function parseEmbedding(rawEmbedding: string | null) {
  if (!rawEmbedding) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawEmbedding);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return null;
    }

    const values = parsed.filter((value) => typeof value === "number" && Number.isFinite(value));
    return values.length === parsed.length ? values : null;
  } catch {
    return null;
  }
}

async function selectRelevantFiles(question: string, files: FileSummary[]) {
  const queryEmbedding = await generateEmbedding(question);

  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    return files
      .filter((file) => file.purpose)
      .slice(0, TOP_K_RESULTS)
      .map((file) => ({ path: file.path, purpose: file.purpose, score: 0 }));
  }

  const rankedFiles: RankedFile[] = [];

  for (const file of files) {
    if (!file.purpose) {
      continue;
    }

    const embedding = parseEmbedding(file.embedding);
    if (!embedding) {
      continue;
    }

    const score = cosineSimilarity(queryEmbedding, embedding);
    if (!Number.isFinite(score)) {
      continue;
    }

    rankedFiles.push({
      path: file.path,
      purpose: file.purpose,
      score,
    });
  }

  if (rankedFiles.length === 0) {
    return files
      .filter((file) => file.purpose)
      .slice(0, TOP_K_RESULTS)
      .map((file) => ({ path: file.path, purpose: file.purpose, score: 0 }));
  }

  rankedFiles.sort((a, b) => b.score - a.score);
  return rankedFiles.slice(0, TOP_K_RESULTS);
}

export async function ask(question: string, repo?: string): Promise<string> {
  const repoName = normalizeRepoName(repo);
  const normalized = normalizeQuestion(question);

  // NEW: multi-repo support
  const cachedAnswer = getCachedAnswer(repoName, normalized);
  if (cachedAnswer) {
    return cachedAnswer;
  }

  // NEW: multi-repo support
  const files = getFilesByRepo(repoName) as FileSummary[];

  if (files.length === 0) {
    return `No repository data found for repo "${repoName}". Please run \`init\` first to index it.`;
  }

  const relevantFiles = await selectRelevantFiles(question, files);
  const context = relevantFiles.map((file) => `- ${file.path}: ${file.purpose}`).join("\n");

  const prompt = `You are a helpful assistant that answers questions about a software repository.
Below is a list of the most relevant files in the repo "${repoName}" and their purposes:

${context}

Answer the following question clearly and concisely based only on the repo context above.
If the answer cannot be determined from the context, say so honestly.

Question: ${question}`;

  let answer: string;

  try {
    if (!model) {
      answer = fallbackAnswer(question, relevantFiles);
    } else {
      const result = await model.generateContent(prompt);
      answer = result.response.text();

      if (!answer) {
        throw new Error("Empty response from Gemini");
      }
    }
  } catch (err: any) {
    const message = String(err?.message ?? err ?? "Unknown Gemini error");
    if (shouldUseFallback(message)) {
      answer = fallbackAnswer(question, relevantFiles);
    } else {
      throw new Error(`Gemini API error: ${message}`);
    }
  }

  // NEW: multi-repo support
  saveAnswer(repoName, normalized, answer);
  saveDB();

  return answer;
}
