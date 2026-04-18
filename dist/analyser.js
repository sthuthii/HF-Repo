"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyseFile = analyseFile;
const axios_1 = __importDefault(require("axios"));
async function analyseFile(content) {
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
    const res = await axios_1.default.post("https://api.anthropic.com/v1/messages", {
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
//# sourceMappingURL=analyser.js.map