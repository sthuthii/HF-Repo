import "dotenv/config";

import db from "./db";
import axios from "axios";

interface FileSummary {
  path: string;
  purpose: string;
}

interface QaCache {
  question: string;
  answer: string;
}

export async function ask(question: string) {
  const cached = db.prepare(`
    SELECT answer FROM qa_cache WHERE question = ?
  `).get(question) as QaCache | undefined;

  if (cached) return cached.answer;

  const files = db.prepare(`
    SELECT path, purpose FROM files LIMIT 20
  `).all() as FileSummary[];

  const context = files.map(f => `${f.path}: ${f.purpose}`).join("\n");

  const prompt = `
  Answer the question based on repo:

  ${context}

  Question: ${question}
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

  const answer = res.data.content[0].text;

  db.prepare(`
    INSERT INTO qa_cache (question, answer)
    VALUES (?, ?)
  `).run(question, answer);

  return answer;
}