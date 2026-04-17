import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Inside src/analyser.ts AND src/ask.ts initialization
// Inside src/analyser.ts AND src/ask.ts
const model = genAI.getGenerativeModel(
  { model: "models/gemini-2.5-flash" },
  { apiVersion: "v1" } // Use stable v1 for production models
);
export async function analyseFile(content: string) {
  const prompt = `
    Analyze the following code. Return ONLY JSON:
    {
      "purpose": "1-sentence description",
      "layer": "core|api|utils|config",
      "importance": 1-5
    }
    Code: ${content.slice(0, 15000)}
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { purpose: "Source file", layer: "core", importance: 3 };
  } catch (error) {
    return { purpose: "Source code", layer: "core", importance: 3 };
  }
}