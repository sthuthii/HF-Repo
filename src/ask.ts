import "dotenv/config";
import path from "path";
import db from "./db";
import { generateEmbedding } from "./embeddings";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Initialize Gemini 1.5 Flash for the final answer
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
// Replace your current model initialization with this:
const model = genAI.getGenerativeModel(
  { model: "models/gemini-3.1-flash-lite-preview" }, // The 2026 high-availability model
  { apiVersion: "v1beta" } // Gemini 3 models require v1beta for now
);
/**
 * Math utility to calculate how similar two vectors are.
 * 1.0 = identical, 0.0 = completely different.
 */
function cosineSimilarity(vecA: number[], vecB: number[]) {
  const dot = vecA.reduce((s, a, i) => s + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((s, a) => s + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((s, b) => s + b * b, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

async function ask(question: string) {
  if (!question) {
    console.log("⚠️ Please provide a question in quotes. Example: npx ts-node src/ask.ts \"What does init.ts do?\"");
    return;
  }

  console.log(`🔎 Searching index for: "${question}"...`);
  
  // 2. Fetch all files that were successfully vectorized
  const files = db.prepare("SELECT * FROM files WHERE embedding IS NOT NULL AND embedding != 'SKIPPED'").all() as any[];
  
  if (files.length === 0) {
    console.log("⚠️ No searchable vectors found. Please run 'npx ts-node src/init.ts .' first.");
    return;
  }

  try {
    // 3. Turn the user's question into a vector
    const qVec = await generateEmbedding(question);

    // 4. Rank files by similarity to the question
    const ranked = files.map(f => {
      try {
        const fileVec = JSON.parse(f.embedding);
        return {
          ...f,
          score: cosineSimilarity(qVec, fileVec)
        };
      } catch (e) {
        return { ...f, score: 0 };
      }
    }).sort((a, b) => b.score - a.score);

    // 5. Take the top 3 most relevant files as context
    const topResults = ranked.slice(0, 3);
    console.log(`✅ Found ${topResults.length} relevant files for context.`);

    const context = topResults.map(f => 
      `File: ${path.basename(f.path)}\nPurpose: ${f.purpose}\nContent:\n${f.raw_content}`
    ).join("\n\n---\n\n");

    // 6. Ask Gemini to answer using ONLY the provided code context
    const prompt = `
      You are an expert Senior Software Engineer. 
      Use the provided code context to answer the user's question about this repository.
      If the answer is not in the context, be honest and say so.

      QUESTION: ${question}

      CONTEXT:
      ${context}
    `;
    
    const result = await model.generateContent(prompt);
    console.log(`\n✨ AI Assistant:\n${result.response.text()}`);

  } catch (err: any) {
    console.error(`❌ Error during RAG process: ${err.message}`);
    if (err.message.includes("fetch failed")) {
      console.log("💡 Networking tip: Check your internet or try adding '--dns-result-order=ipv4first' to your node command.");
    }
  }
}

// Start the search
const userQuestion = process.argv.slice(2).join(" ");
ask(userQuestion).catch(console.error);