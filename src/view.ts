// src/view.ts
import fs from 'fs';
import path from 'path';
import { FileClassifier } from './roleClassifier';
import { adaptFilesToRoleViews, SimpleFile } from './viewAdapter';
import { renderRoleView } from './roleViewRenderer';

const targetDir = process.argv[2] || '.';

// Exact same dependency extraction logic used in your testSystem.ts
function getDependencies(content: string): string[] {
  const deps: string[] = [];
  const jsImports = content.match(/import\s+(?:.*?from\s+)?['"]([^'"]+)['"]/g) || [];
  jsImports.forEach((imp) => {
    const match = imp.match(/['"]([^'"]+)['"]/);
    if (match) deps.push(match[1]);
  });
  return deps;
}

function main() {
  console.log(`🔍 Analyzing repository: ${targetDir}...\n`);

  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Directory not found: ${targetDir}`);
    process.exit(1);
  }

  // 1. Safely walk the directory
  const allowedExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.sql', '.yaml', '.yml'];
  const filesToAnalyze: string[] = [];

  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      // Skip noise folders
      if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (allowedExts.includes(ext) || entry.name === 'Dockerfile') {
          filesToAnalyze.push(fullPath);
        }
      }
    }
  }

  walkDir(targetDir);

  // 2. Classify files using your exact existing FileClassifier
  const classifier = new FileClassifier();
  const rawFiles: SimpleFile[] = [];

  for (const filePath of filesToAnalyze) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const classification = classifier.classifyFile(filePath, content);
      const deps = getDependencies(content);
      
      // Defensively extract top role and score
      const scores = classification.scores || {};
      const sortedScores = Object.entries(scores).sort(([, a], [, b]) => b - a);
      const topRole = sortedScores[0]?.[0] || 'unknown';
      const topScore = sortedScores[0]?.[1] || 0;

            rawFiles.push({
        path: filePath,
        role: classification.primaryRole,
        confidence: classification.confidence,
        dependencies: deps
      });
    } catch (e) {
      // Skip files that can't be read (like binary files)
    }
  }

  if (rawFiles.length === 0) {
    console.log("No files found to analyze.");
    return;
  }

  // 3. Run through our safe new pipeline
  const views = adaptFilesToRoleViews(rawFiles);

  // 4. Render to terminal
  const sortedRoles = Object.entries(views)
    .sort(([, a], [, b]) => (b.primary.length + b.supporting.length) - (a.primary.length + a.supporting.length));

  for (const [role, view] of sortedRoles) {
    console.log(renderRoleView(role, view));
  }
}

main();