"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRepo = initRepo;
require("dotenv/config");
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const db_1 = __importStar(require("./db"));
const walker_1 = require("./walker");
const analyser_1 = require("./analyser");
const roleClassifier_1 = require("./roleClassifier");
const dependencyParser_1 = require("./dependencyParser");
const classifier = new roleClassifier_1.FileClassifier();
async function initRepo(url) {
    (0, db_1.initDB)();
    const repoName = url.split("/").pop()?.replace(".git", "");
    const repoPath = `.repomap/${repoName}`;
    (0, child_process_1.execSync)(`git clone ${url} ${repoPath}`);
    const files = (0, walker_1.walk)(repoPath);
    for (const file of files) {
        const content = fs_1.default.readFileSync(file, "utf-8");
        let meta = { purpose: "N/A (AI bypassed)", layer: "core", importance: 1 };
        try {
            meta = await (0, analyser_1.analyseFile)(content);
        }
        catch (e) {
            // AI failed (401 error, etc.), keep using dummy data
        }
        const classification = classifier.classifyFile(file, content);
        const rawDeps = dependencyParser_1.DependencyParser.extractImports(content);
        const cleanDeps = rawDeps
            .map(dep => dependencyParser_1.DependencyParser.cleanDependency(dep))
            .filter(dep => !/[\(\)\. ]/.test(dep));
        db_1.default.prepare(`
      INSERT INTO files (path, purpose, layer, importance, raw_content)
      VALUES (?, ?, ?, ?, ?)
    `).run(file, meta.purpose, meta.layer, meta.importance, content);
    }
    for (const file of files) {
        const content = fs_1.default.readFileSync(file, "utf-8");
        const meta = await (0, analyser_1.analyseFile)(content);
        // FIX 1: Pass 'file', not 'repoPath'
        const classification = classifier.classifyFile(file, content);
        const rawDeps = dependencyParser_1.DependencyParser.extractImports(content);
        const cleanDeps = rawDeps
            .map(dep => dependencyParser_1.DependencyParser.cleanDependency(dep))
            .filter(dep => !/[\(\)\. ]/.test(dep));
        console.log(`Indexing: ${file} -> Role: ${classification.primaryRole}`);
        // FIX 2 & 3: Add the 3 new columns, and JSON.stringify the objects
        db_1.default.prepare(`
      INSERT INTO files (path, purpose, layer, importance, raw_content, primary_role, role_scores, dependencies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(file, meta.purpose, meta.layer, meta.importance, content, classification.primaryRole, JSON.stringify(classification.scores), JSON.stringify(cleanDeps));
    }
}
//# sourceMappingURL=init.js.map