import "dotenv/config";
import db from "./db";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface FileSummary {
  path: string;
  purpose: string;
}

interface QaCache {
  question: string;
  answer: string;
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Normalize question for reliable cache hits
function normalizeQuestion(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function ask(question: string): Promise<string> {
  const normalized = normalizeQuestion(question);

  // 1. Check cache first
  const cached = db.prepare(`
    SELECT answer FROM qa_cache WHERE question = ?
  `).get(normalized) as QaCache | undefined;

  if (cached) return cached.answer;

  // 2. Fetch all file summaries from DB
  const files = db.prepare(`
    SELECT path, purpose FROM files
  `).all() as FileSummary[];

  if (files.length === 0) {
    return "No repository data found. Please run `init` first to index the repo.";
  }

  const context = files
    .map(f => `- ${f.path}: ${f.purpose}`)
    .join("\n");

  // 3. Build prompt
  const prompt = `You are a helpful assistant that answers questions about a software repository.
Below is a list of files in the repo and their purposes:

${context}

Answer the following question clearly and concisely based only on the repo context above.
If the answer cannot be determined from the context, say so honestly.

Question: ${question}`;

  // 4. Call Gemini API
  let answer: string;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    answer = response.text();

    if (!answer) throw new Error("Empty response from Gemini");

  } catch (err: any) {
    throw new Error(`Gemini API error: ${err.message}`);
  }

  // 5. Cache the result
  db.prepare(`
    INSERT OR IGNORE INTO qa_cache (question, answer) VALUES (?, ?)
  `).run(normalized, answer);

  return answer;
}