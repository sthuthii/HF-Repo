"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummary = getSummary;
require("dotenv/config");
const db_1 = __importDefault(require("./db"));
function getSummary() {
    const files = db_1.default.prepare("SELECT * FROM files").all();
    return `
Repo contains ${files.length} files.
Main components:
${files.slice(0, 5).map(f => `- ${f.path}: ${f.purpose}`).join("\n")}
  `;
}
//# sourceMappingURL=summary.js.map