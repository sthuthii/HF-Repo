// src/test-safe-pipeline.ts
import { adaptFilesToRoleViews } from './viewAdapter';
import { renderRoleView } from './roleViewRenderer';

console.log("=== Step 3: Full Pipeline Integration Test ===\n");

// The same messy mock data from before
const messyRawData = [
  { path: "frontend\\src\\App.tsx", role: "frontend", confidence: 1.0, dependencies: ["Summary"] },
  { path: "frontend\\src\\components\\Ask.tsx", role: "frontend", confidence: 0.90, dependencies: ["react"] },
  { path: "frontend\\tsconfig.json", role: "backend", confidence: 0.50, dependencies: [] },
  { path: "backend\\server.ts", role: "backend", confidence: 0.48, dependencies: [] },
  { path: "backend\\db.ts", role: "backend", confidence: 0.80, dependencies: ["fs"] },
  { path: "Dockerfile", role: "devops", confidence: 1.0, dependencies: [] }
];

// 1. Clean the data
const organizedViews = adaptFilesToRoleViews(messyRawData);

// 2. Render the Backend view
console.log("--- RENDERING BACKEND VIEW ---");
const backendOutput = renderRoleView('backend', organizedViews['backend']);
console.log(backendOutput);

// 3. Render the Frontend view
console.log("\n--- RENDERING FRONTEND VIEW ---");
const frontendOutput = renderRoleView('frontend', organizedViews['frontend']);
console.log(frontendOutput);

// 4. Render the DevOps view
console.log("\n--- RENDERING DEVOPS VIEW ---");
const devopsOutput = renderRoleView('devops', organizedViews['devops']);
console.log(devopsOutput);

// Quick Sanity Check
let failed = false;
if (!backendOutput.includes('1 primary') || !backendOutput.includes('⚙️')) failed = true;
if (!frontendOutput.includes('2 primary') || !frontendOutput.includes('🎨')) failed = true;
if (!devopsOutput.includes('2 primary') || !devopsOutput.includes('🚀')) failed = true;

if (!failed) {
  console.log("🎉 SUCCESS: All views rendered perfectly without touching core files!");
}