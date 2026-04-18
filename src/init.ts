import "dotenv/config";
import path from "path";
import { execSync } from "child_process";
import fs from "fs";
import db, { initDB } from "./db";
import { walk } from "./walker";
import { analyseFile } from "./analyser";
import { FileClassifier } from "./roleClassifier";
import { DependencyParser } from "./dependencyParser";
const classifier = new FileClassifier();

export async function initRepo(url: string) {
  const dbPath = path.join(process.cwd(), ".repomap", "db.sqlite");
    // Migration script to be created separately
    // const { migrateDatabase } = require("./migration");
    // migrateDatabase(dbPath);

    initDB();

  const repoName = url.split("/").pop()?.replace(".git", "");
  const repoPath = `.repomap/${repoName}`;

  execSync(`git clone ${url} ${repoPath}`);

  const files = walk(repoPath);

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");

     let meta = { purpose: "N/A (AI bypassed)", layer: "core", importance: 1 };
    try {
      meta = await analyseFile(content);
    } catch (e) {
      // AI failed (401 error, etc.), keep using dummy data
    }

    const classification = classifier.classifyFile(file, content);
    const rawDeps = DependencyParser.extractImports(content);
const cleanDeps = rawDeps
  .map(dep => DependencyParser.cleanDependency(dep))
  .filter(dep => !/[\(\)\. ]/.test(dep));
    db.prepare(`
      INSERT INTO files (path, purpose, layer, importance, raw_content)
      VALUES (?, ?, ?, ?, ?)
    `).run(file, meta.purpose, meta.layer, meta.importance, content);
  }

    for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");

    const meta = await analyseFile(content);
    
    // FIX 1: Pass 'file', not 'repoPath'
    const classification = classifier.classifyFile(file, content);
    
    const rawDeps = DependencyParser.extractImports(content);
    
    const cleanDeps = rawDeps
      .map(dep => DependencyParser.cleanDependency(dep))
      .filter(dep => !/[\(\)\. ]/.test(dep));
     console.log(`Indexing: ${file} -> Role: ${classification.primaryRole}`);
    // FIX 2 & 3: Add the 3 new columns, and JSON.stringify the objects
    db.prepare(`
      INSERT INTO files (path, purpose, layer, importance, raw_content, primary_role, role_scores, dependencies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      file, 
      meta.purpose, 
      meta.layer, 
      meta.importance, 
      content,
      classification.primaryRole,
      JSON.stringify(classification.scores),
      JSON.stringify(cleanDeps)
    );
  }
}