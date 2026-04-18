import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fallbackAnalyseFile } from "./aiFallbacks";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const analysisModelCandidates = (
  process.env.GEMINI_ANALYSIS_MODELS ?? "gemini-2.5-flash-lite,gemini-1.5-flash"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

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

const MAX_ANALYSIS_CHARS = 12000;

function prepareContentForAnalysis(content: string) {
  if (content.length <= MAX_ANALYSIS_CHARS) {
    return content;
  }

  const headSize = Math.floor(MAX_ANALYSIS_CHARS * 0.7);
  const tailSize = MAX_ANALYSIS_CHARS - headSize;

  return [
    content.slice(0, headSize),
    "\n\n... [content truncated to stay within token budget] ...\n\n",
    content.slice(-tailSize),
  ].join("");
}

export async function analyseFile(content: string, filePath = "unknown-file") {
  const trimmedContent = prepareContentForAnalysis(content);
  const prompt = `
    Analyze the following source code file. 
    Return a JSON object with exactly these fields:
    {
      "purpose": "A brief 1-sentence description of what this file does",
      "layer": "core | api | utils | tests | config",
      "importance": 1-5
    }

    FILE CONTENT:
    ${trimmedContent}
  `;

  try {
    if (!genAI || analysisModelCandidates.length === 0) {
      return fallbackAnalyseFile(filePath, trimmedContent);
    }

    let lastError: unknown = null;

    for (const modelName of analysisModelCandidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: "v1" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error(`No valid JSON found in response from ${modelName}`);
        }

        return JSON.parse(jsonMatch[0]);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Gemini analysis failed");
  } catch (error: any) {
    const message = String(error?.message ?? error ?? "Unknown Gemini error");
    if (shouldUseFallback(message)) {
      return fallbackAnalyseFile(filePath, trimmedContent);
    }

    throw new Error(`Gemini Analysis Failed: ${message}`);
  }
}
