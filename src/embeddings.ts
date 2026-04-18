import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fallbackEmbedding } from "./aiFallbacks";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI
  ? genAI.getGenerativeModel(
      { model: process.env.GEMINI_EMBEDDING_MODEL ?? "models/gemini-embedding-001" },
      { apiVersion: "v1beta" }
    )
  : null;

function shouldUseFallback(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("403") ||
    normalized.includes("404") ||
    normalized.includes("denied access") ||
    normalized.includes("not found") ||
    normalized.includes("is not supported for generatecontent") ||
    normalized.includes("fetch failed") ||
    normalized.includes("econnreset") ||
    normalized.includes("enotfound") ||
    normalized.includes("timed out")
  );
}

export async function generateEmbedding(text: string) {
  if (!text) {
    return [];
  }

  if (!model) {
    return fallbackEmbedding(text);
  }

  try {
    const result = await model.embedContent(text);
    const values = result.embedding?.values;

    if (!values || !Array.isArray(values)) {
      throw new Error("Failed to generate embedding");
    }

    return values;
  } catch (error: any) {
    const message = String(error?.message ?? error ?? "Unknown Gemini embedding error");
    if (shouldUseFallback(message)) {
      return fallbackEmbedding(text);
    }

    throw error;
  }
}
