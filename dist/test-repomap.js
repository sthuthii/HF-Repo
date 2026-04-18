"use strict";
// src/test-repomap.ts
Object.defineProperty(exports, "__esModule", { value: true });
const improvedScoringEngine_1 = require("./improvedScoringEngine");
const explanationEngine_1 = require("./explanationEngine");
const roleViewCLIRenderer_1 = require("./roleViewCLIRenderer");
function runIntegrationTest() {
    console.log("=== Running Pipeline Integration Test ===\n");
    // 1. Mock a backend file (like the one in your original error log)
    const mockFilePath = 'src/api/controllers/user.ts';
    const mockContent = `
    import express from 'express';
    const router = express.Router();
    router.get('/users', async (req, res) => { res.send([]) });
  `;
    // 2. Score it
    const scoredFile = (0, improvedScoringEngine_1.scoreFile)(mockFilePath, mockContent);
    console.log("Scored Output:", JSON.stringify(scoredFile, null, 2));
    // 3. Explain it
    const explanation = (0, explanationEngine_1.generateExplanation)(scoredFile);
    console.log("\nExplanation:", explanation);
    // 4. Render it
    const renderedView = (0, roleViewCLIRenderer_1.renderRoleView)('backend', [scoredFile]);
    console.log("\nCLI Rendering:");
    console.log(renderedView);
    // 5. ASSERTIONS (To catch the bugs from before)
    let passed = true;
    if (renderedView.includes('0 primary')) {
        console.error("❌ FAIL: Renderer still showing '0 primary' files!");
        passed = false;
    }
    else if (renderedView.includes('1 primary')) {
        console.log("✅ PASS: Renderer correctly counts 1 primary file.");
    }
    if (explanation.includes('Renders UI')) {
        console.error("❌ FAIL: Explanation engine is still using Frontend logic for a Backend file!");
        passed = false;
    }
    else if (explanation.includes('API routing')) {
        console.log("✅ PASS: Explanation engine correctly identifies backend context.");
    }
    if (String(scoredFile.scores.frontend).length > 4) {
        console.error("❌ FAIL: Float precision not fixed (too many decimals).");
        passed = false;
    }
    else {
        console.log("✅ PASS: Float precision correctly rounded.");
    }
    console.log("\n=== Test Complete ===");
}
runIntegrationTest();
//# sourceMappingURL=test-repomap.js.map