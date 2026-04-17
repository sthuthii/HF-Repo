import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateEmbedding(text: string): Promise<number[]> {
  // Use 'models/gemini-embedding-001' - the 2026 stable production model
 // Inside src/embeddings.ts
const model = genAI.getGenerativeModel(
  { model: "models/gemini-embedding-2-preview" },
  { apiVersion: "v1beta" } // 404 Fix: Preview models require v1beta
);
  
  try {
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error: any) {
    console.error("Embedding 2026 Fix:", error.message);
    throw error;
  }
}