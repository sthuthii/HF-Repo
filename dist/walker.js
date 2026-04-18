"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.walk = walk;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function walk(dir) {
    let results = [];
    const list = fs_1.default.readdirSync(dir);
    list.forEach((file) => {
        const fullPath = path_1.default.join(dir, file);
        const stat = fs_1.default.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (file === "node_modules" || file.startsWith("."))
                return;
            results = results.concat(walk(fullPath));
        }
        else {
            results.push(fullPath);
        }
    });
    return results;
}
//# sourceMappingURL=walker.js.map