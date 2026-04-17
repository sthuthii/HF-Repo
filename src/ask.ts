import "dotenv/config";
import db from "./db";
import { generateEmbedding } from "./embeddings";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return magA && magB ? dotProduct / (magA * magB) : 0;
}

async function ask(question: string) {
  console.log(`🔎 Searching for: "${question}"...`);

  // Filter out SKIPPED rows and ensure it looks like a JSON array
  const files = db.prepare(`
    SELECT path, purpose, raw_content, embedding 
    FROM files 
    WHERE embedding IS NOT NULL 
    AND embedding != 'SKIPPED'
    AND embedding LIKE '[%'
  `).all() as any[];

  if (files.length === 0) {
    console.log("⚠️ No searchable vectors found yet. Wait for init.ts to finish 1-2 files.");
    return;
  }

  const questionVector = await generateEmbedding(question);

  const ranked = files.map(file => ({
    ...file,
    score: cosineSimilarity(questionVector, JSON.parse(file.embedding))
  })).sort((a, b) => b.score - a.score);

  const context = ranked.slice(0, 3).map(f => 
    `File: ${f.path}\nPurpose: ${f.purpose}\nContent:\n${f.content}`
  ).join("\n\n---\n\n");

  const prompt = `Use this code context to answer: ${question}\n\nCONTEXT:\n${context}`;
  const result = await model.generateContent(prompt);
  console.log(`\n✨ Answer:\n${result.response.text()}`);
}

ask(process.argv.slice(2).join(" ")).catch(console.error);