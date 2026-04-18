"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFiles = listFiles;
require("dotenv/config");
const db_1 = __importDefault(require("./db"));
function listFiles() {
    return db_1.default.prepare(`
    SELECT path, purpose, importance FROM files
    ORDER BY importance DESC
  `).all();
}
//# sourceMappingURL=files.js.map