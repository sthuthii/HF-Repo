"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ask = ask;
require("dotenv/config");
const db_1 = __importDefault(require("./db"));
const generative_ai_1 = require("@google/generative-ai");
// Initialize Gemini
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// Normalize question for reliable cache hits
function normalizeQuestion(q) {
    return q.trim().toLowerCase().replace(/\s+/g, " ");
}
async function ask(question) {
    const normalized = normalizeQuestion(question);
    // 1. Check cache first
    const cached = db_1.default.prepare(`
    SELECT answer FROM qa_cache WHERE question = ?
  `).get(normalized);
    if (cached)
        return cached.answer;
    // 2. Fetch all file summaries from DB
    const files = db_1.default.prepare(`
    SELECT path, purpose FROM files
  `).all();
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
    let answer;
    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        answer = response.text();
        if (!answer)
            throw new Error("Empty response from Gemini");
    }
    catch (err) {
        throw new Error(`Gemini API error: ${err.message}`);
    }
    // 5. Cache the result
    db_1.default.prepare(`
    INSERT OR IGNORE INTO qa_cache (question, answer) VALUES (?, ?)
  `).run(normalized, answer);
    return answer;
}
//# sourceMappingURL=ask.js.map