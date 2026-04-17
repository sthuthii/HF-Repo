import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Explicitly initialize the client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 2. Force the model to use the most common stable identifier
// We use 'gemini-1.5-flash' (no -latest) and avoid v1beta defaults
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash-lite" // Highest RPM (15) for 2026 Free Tier
}, { apiVersion: "v1" });// <--- FORCING STABLE V1

export async function analyseFile(content: string) {
  const prompt = `
    Analyze the following source code file. 
    Return a JSON object with exactly these fields:
    {
      "purpose": "A brief 1-sentence description of what this file does",
      "layer": "core | api | utils | tests | config",
      "importance": 1-5
    }

    FILE CONTENT:
    ${content}
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean up potential markdown formatting
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No valid JSON found in response");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    // If 'gemini-1.5-flash' still fails, the API key might only have access to 1.0 Pro
    throw new Error(`Gemini Analysis Failed: ${error.message}`);
  }
}