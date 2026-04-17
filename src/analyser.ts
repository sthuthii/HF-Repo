import axios from "axios";

export async function analyseFile(content: string) {
  const prompt = `
  Analyze this file and return JSON:
  {
    "purpose": "...",
    "layer": "core|api|utils|tests|config",
    "importance": 1-5
  }

  FILE:
  ${content}
  `;

  const res = await axios.post("https://api.anthropic.com/v1/messages", {
    model: "claude-3-sonnet-20240229",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }]
  }, {
    headers: {
      "x-api-key": process.env.CLAUDE_API_KEY
    }
  });

  return JSON.parse(res.data.content[0].text);
}