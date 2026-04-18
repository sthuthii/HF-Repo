"use strict";
/**
 * Complete Validation System for Role-Based Repository Analysis
 *
 * Tests:
 * 1. Custom test cases (accuracy validation)
 * 2. Real repository scanning (real-world validation)
 * 3. Automatic issue detection (robustness checks)
 * 4. System health score calculation
 *
 * Usage: npx ts-node src/testSystem.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const roleClassifier_1 = require("./roleClassifier");
const config_1 = require("./config");
// ============================================================================
// PART 1: CUSTOM TEST CASES
// ============================================================================
const CUSTOM_TEST_CASES = [
    {
        name: "React Component",
        path: "src/components/UserCard.tsx",
        content: `import React from 'react';
export const UserCard: React.FC = ({ user }) => (
  <div className="card">
    <h2>{user.name}</h2>
    <button onClick={() => handleClick(user.id)}>Edit</button>
  </div>
);`,
        expectedRole: config_1.Role.FRONTEND,
    },
    {
        name: "Express API Endpoint",
        path: "api/routes/users.ts",
        content: `import express from 'express';
const router = express.Router();
router.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});`,
        expectedRole: config_1.Role.BACKEND,
    },
    {
        name: "Database Migration",
        path: "db/migrations/001_create_users.sql",
        content: `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE
);`,
        expectedRole: config_1.Role.DATA,
    },
    {
        name: "Dockerfile",
        path: "Dockerfile",
        content: `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`,
        expectedRole: config_1.Role.DEVOPS,
    },
    {
        name: "ML Training Script",
        path: "ml/train.py",
        content: `import torch
from sklearn.model_selection import train_test_split
model = NeuralNetwork()
optimizer = torch.optim.Adam(model.parameters())
for epoch in range(100):
    loss = loss_fn(model(X), y)
    loss.backward()`,
        expectedRole: config_1.Role.AI_ML,
    },
    {
        name: "Jest Unit Test",
        path: "tests/unit/utils.test.ts",
        content: `import { sum } from '../utils';
describe('utils', () => {
  it('should add numbers', () => {
    expect(sum(2, 3)).toBe(5);
  });
});`,
        expectedRole: config_1.Role.QA,
    },
    {
        name: "Auth Service",
        path: "src/services/authService.ts",
        content: `import jwt from 'jsonwebtoken';
export class AuthService {
  verifyToken(token: string) {
    return jwt.verify(token, process.env.SECRET);
  }
  generateToken(userId: string) {
    return jwt.sign({ userId }, process.env.SECRET);
  }
}`,
        expectedRole: config_1.Role.SECURITY,
    },
    {
        name: "Next.js API Route",
        path: "pages/api/profile.ts",
        content: `import { NextApiRequest, NextApiResponse } from 'next';
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const user = await db.users.findOne();
    res.json(user);
  }
}`,
        expectedRole: config_1.Role.FULL_STACK,
    },
];
// ============================================================================
// PART 2: HELPER FUNCTIONS
// ============================================================================
/**
 * Scan directory recursively, excluding certain folders
 */
function scanDirectory(dirPath, maxFiles = 30) {
    const files = [];
    const excludeDirs = ["node_modules", ".git", "dist", "build", ".next", "coverage"];
    function walk(currentPath) {
        if (files.length >= maxFiles)
            return;
        try {
            const entries = fs_1.default.readdirSync(currentPath, { withFileTypes: true });
            for (const entry of entries) {
                if (files.length >= maxFiles)
                    break;
                const fullPath = path_1.default.join(currentPath, entry.name);
                const relativePath = path_1.default.relative(process.cwd(), fullPath);
                // Skip excluded directories
                if (entry.isDirectory()) {
                    if (!excludeDirs.some((exc) => relativePath.includes(exc))) {
                        walk(fullPath);
                    }
                }
                else {
                    // Include TypeScript, JavaScript, Python, SQL files
                    if (/\.(tsx?|jsx?|py|sql|json|yaml|yml|sh)$/.test(entry.name)) {
                        files.push(fullPath);
                    }
                }
            }
        }
        catch (error) {
            // Silently skip directories we can't read
        }
    }
    walk(dirPath);
    return files;
}
/**
 * Read file content safely
 */
function readFileContent(filePath) {
    try {
        return fs_1.default.readFileSync(filePath, "utf-8").slice(0, 5000); // Limit to 5KB
    }
    catch {
        return "";
    }
}
/**
 * Extract dependencies from file content
 */
function extractDependencies(content) {
    const dependencies = new Set();
    // JavaScript/TypeScript imports
    const jsImports = content.match(/import\s+(?:.*?from\s+)?['"]([^'"]+)['"]/g) || [];
    jsImports.forEach((imp) => {
        const match = imp.match(/['"]([^'"]+)['"]/);
        if (match)
            dependencies.add(match[1]);
    });
    // Python imports
    const pyImports = content.match(/(?:from|import)\s+(\S+)/g) || [];
    pyImports.forEach((imp) => {
        const match = imp.match(/(?:from|import)\s+(\S+)/);
        if (match)
            dependencies.add(match[1]);
    });
    return Array.from(dependencies).slice(0, 10); // Limit to 10
}
/**
 * Assign priority based on role and score
 */
function assignPriority(score) {
    if (score >= 0.7)
        return "primary";
    if (score >= 0.4)
        return "supporting";
    if (score >= 0.1)
        return "context";
    return "hidden";
}
/**
 * Main analysis function - uses FileClassifier
 */
function analyzeFile(filePath, content) {
    const classifier = new roleClassifier_1.FileClassifier();
    const classification = classifier.classifyFile(filePath, content);
    // Get top 3 roles
    const allScores = Object.entries(classification.scores).sort(([, a], [, b]) => b - a);
    const topRoles = allScores.slice(0, 3).map(([role, score]) => ({
        role,
        score: Number(score.toFixed(3)),
    }));
    return {
        filePath: path_1.default.relative(process.cwd(), filePath),
        primaryRole: classification.primaryRole,
        confidence: classification.confidence,
        scores: classification.scores,
        dependencies: extractDependencies(content),
        priority: assignPriority(classification.confidence),
        topRoles,
    };
}
/**
 * Validate analysis result for issues
 */
function validateResult(result) {
    const issues = [];
    if (!result.primaryRole) {
        issues.push("Missing primary role");
    }
    const scores = Object.values(result.scores);
    if (!scores || scores.length === 0) {
        issues.push("Empty role scores");
    }
    if (!result.priority) {
        issues.push("Missing priority assignment");
    }
    // Suspicious classifications
    const pathLower = result.filePath.toLowerCase();
    if ((pathLower.includes("component") ||
        pathLower.includes("page") ||
        pathLower.includes("ui")) &&
        result.primaryRole !== config_1.Role.FRONTEND) {
        issues.push(`Suspicious: UI-related file classified as ${result.primaryRole}, not FRONTEND`);
    }
    if ((pathLower.includes("test") ||
        pathLower.includes("spec") ||
        pathLower.includes("__tests__")) &&
        result.primaryRole !== config_1.Role.QA) {
        issues.push(`Suspicious: Test file classified as ${result.primaryRole}, not QA`);
    }
    if ((pathLower.includes("controller") ||
        pathLower.includes("service") ||
        pathLower.includes("model")) &&
        ![config_1.Role.BACKEND, config_1.Role.FULL_STACK].includes(result.primaryRole)) {
        issues.push(`Suspicious: Backend service classified as ${result.primaryRole}`);
    }
    return {
        filePath: result.filePath,
        issues,
        isValid: issues.length === 0,
    };
}
// ============================================================================
// PART 3: REPORTING FUNCTIONS
// ============================================================================
function printHeader(title) {
    const width = 70;
    console.log("\n" + "═".repeat(width));
    console.log("  " + title.padEnd(width - 4));
    console.log("═".repeat(width));
}
function printSubHeader(title) {
    console.log("\n┌─ " + title + " " + "─".repeat(65 - title.length) + "┐");
}
function printFooter() {
    console.log("└" + "─".repeat(69) + "┘");
}
/**
 * Print custom test results
 */
function printCustomTestResults(results) {
    printHeader("PART 1: CUSTOM TEST VALIDATION");
    let passed = 0;
    let failed = 0;
    for (const { test, result, passed: testPassed } of results) {
        const indicator = testPassed ? "✓ PASS" : "✗ FAIL";
        const color = testPassed ? "\x1b[32m" : "\x1b[31m";
        const reset = "\x1b[0m";
        console.log(`\n${color}${indicator}${reset} ${test.name}`);
        console.log(`  Path: ${result.filePath}`);
        console.log(`  Expected: ${test.expectedRole}`);
        console.log(`  Predicted: ${result.primaryRole} (${(result.confidence * 100).toFixed(1)}%)`);
        console.log(`  Scores (top 3):`);
        for (const { role, score } of result.topRoles) {
            console.log(`    • ${role.padEnd(12)} ${(score * 100).toFixed(1).padStart(5)}%`);
        }
        if (testPassed)
            passed++;
        else
            failed++;
    }
    printSubHeader("Custom Test Summary");
    console.log(`  ✓ Passed: ${passed}/${results.length}`);
    console.log(`  ✗ Failed: ${failed}/${results.length}`);
    console.log(`  📊 Accuracy: ${((passed / results.length) * 100).toFixed(1)}%`);
    printFooter();
    return { passed, failed };
}
/**
 * Print real repository analysis
 */
function printRepositoryAnalysis(results) {
    printHeader("PART 2: REAL REPOSITORY ANALYSIS");
    for (const result of results) {
        console.log(`\n📄 ${result.filePath}`);
        console.log(`   Role: ${result.primaryRole} (confidence: ${(result.confidence * 100).toFixed(1)}%)`);
        console.log(`   Priority: ${result.priority}`);
        console.log(`   Top roles:`);
        for (const { role, score } of result.topRoles) {
            console.log(`     • ${role.padEnd(12)} ${(score * 100).toFixed(1).padStart(5)}%`);
        }
        if (result.dependencies && result.dependencies.length > 0) {
            const cleanDisplay = result.dependencies
                .slice(0, 5)
                .map(dep => {
                // Basic cleaning (remove quotes, semicolons, AND curly braces)
                let cleaned = dep.replace(/['"\;\{\}]/g, "").trim();
                // Remove trailing commas
                cleaned = cleaned.replace(/,+$/, "");
                return cleaned;
            })
                .filter(dep => dep !== "")
                // Drop anything with parentheses, periods, or spaces
                .filter(dep => !/[\(\)\. ]/.test(dep))
                .join(", ");
            if (cleanDisplay.length > 0) {
                console.log(`   Dependencies: ${cleanDisplay}`);
            }
        }
    }
    console.log(`\n\n📊 Repository Statistics:`);
    console.log(`  Total files analyzed: ${results.length}`);
    // Role distribution
    const roleDistribution = {};
    for (const result of results) {
        roleDistribution[result.primaryRole] =
            (roleDistribution[result.primaryRole] || 0) + 1;
    }
    console.log(`  Role distribution:`);
    for (const [role, count] of Object.entries(roleDistribution).sort(([, a], [, b]) => b - a)) {
        const pct = ((count / results.length) * 100).toFixed(0);
        console.log(`    • ${role.padEnd(12)} ${count.toString().padStart(3)} files (${pct}%)`);
    }
}
/**
 * Print validation results
 */
function printValidationResults(results) {
    printHeader("PART 3: VALIDATION CHECKS");
    let validCount = 0;
    let issueCount = 0;
    let totalIssues = 0;
    const issueCategories = {
        missingRole: 0,
        emptyScores: 0,
        missingDependencies: 0,
        missingPriority: 0,
        suspiciousClassification: 0,
    };
    for (const result of results) {
        if (result.isValid) {
            validCount++;
        }
        else {
            issueCount++;
            for (const issue of result.issues) {
                totalIssues++;
                if (issue.includes("Missing primary role"))
                    issueCategories.missingRole++;
                else if (issue.includes("Empty role scores"))
                    issueCategories.emptyScores++;
                else if (issue.includes("Missing priority"))
                    issueCategories.missingPriority++;
                else if (issue.includes("Suspicious"))
                    issueCategories.suspiciousClassification++;
            }
            console.log(`\n⚠️  ${result.filePath}`);
            for (const issue of result.issues) {
                console.log(`    • ${issue}`);
            }
        }
    }
    printSubHeader("Validation Summary");
    console.log(`  ✓ Valid files: ${validCount}/${results.length}`);
    console.log(`  ⚠️  Files with issues: ${issueCount}/${results.length}`);
    console.log(`  Total issues found: ${totalIssues}`);
    console.log(`\n  Issue breakdown:`);
    console.log(`    • Missing roles: ${issueCategories.missingRole}`);
    console.log(`    • Empty scores: ${issueCategories.emptyScores}`);
    console.log(`    • Missing priority: ${issueCategories.missingPriority}`);
    console.log(`    • Suspicious classifications: ${issueCategories.suspiciousClassification}`);
    printFooter();
    return { validCount, issueCount, totalIssues };
}
/**
 * Print system health report
 */
function printHealthReport(stats) {
    printHeader("PART 4: SYSTEM HEALTH REPORT");
    console.log("\n📈 Test Results:");
    console.log(`  Custom tests: ${stats.customTestsPassed}/${stats.totalCustomTests} passed`);
    console.log(`  Custom accuracy: ${((stats.customTestsPassed / stats.totalCustomTests) * 100).toFixed(1)}%`);
    console.log(`\n📁 Repository Analysis:`);
    console.log(`  Files processed: ${stats.totalFiles}`);
    console.log(`  Files with issues: ${stats.filesWithIssues}`);
    console.log(`\n🔍 Issue Summary:`);
    console.log(`  Missing roles: ${stats.missingRoles}`);
    console.log(`  Empty scores: ${stats.emptyScores}`);
    console.log(`  Missing dependencies: ${stats.missingDependencies}`);
    console.log(`  Missing priority: ${stats.missingPriority}`);
    console.log(`  Suspicious classifications: ${stats.suspiciousClassifications}`);
    console.log(`\n💪 System Health:`);
    const healthBar = "█".repeat(Math.floor(stats.healthScore / 5));
    const emptyBar = "░".repeat(20 - Math.floor(stats.healthScore / 5));
    console.log(`  ${healthBar}${emptyBar} ${stats.healthScore.toFixed(1)}%`);
    if (stats.healthScore >= 90) {
        console.log(`  Status: ✓ EXCELLENT - System is production-ready`);
    }
    else if (stats.healthScore >= 75) {
        console.log(`  Status: ◐ GOOD - Minor issues to address`);
    }
    else if (stats.healthScore >= 50) {
        console.log(`  Status: ⚠️  FAIR - Several issues need fixing`);
    }
    else {
        console.log(`  Status: ✗ POOR - Major improvements needed`);
    }
    printFooter();
}
// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function main() {
    console.clear();
    console.log("\n");
    console.log("╔" + "═".repeat(68) + "╗");
    console.log("║" + "  Role-Based Repository Analysis - Complete Validation System".padEnd(69) + "║");
    console.log("╚" + "═".repeat(68) + "╝");
    const stats = {
        totalFiles: 0,
        totalCustomTests: CUSTOM_TEST_CASES.length,
        customTestsPassed: 0,
        customTestsFailure: 0,
        filesWithIssues: 0,
        missingRoles: 0,
        emptyScores: 0,
        missingDependencies: 0,
        missingPriority: 0,
        suspiciousClassifications: 0,
        healthScore: 0,
    };
    // ========================================================================
    // PART 1: CUSTOM TESTS
    // ========================================================================
    const customTestResults = [];
    for (const testCase of CUSTOM_TEST_CASES) {
        const result = analyzeFile(testCase.path, testCase.content);
        const passed = result.primaryRole === testCase.expectedRole;
        customTestResults.push({
            test: testCase,
            result,
            passed,
        });
        if (passed) {
            stats.customTestsPassed++;
        }
        else {
            stats.customTestsFailure++;
        }
    }
    const customTestSummary = printCustomTestResults(customTestResults);
    // ========================================================================
    // PART 2: REAL REPOSITORY ANALYSIS
    // ========================================================================
    const projectRoot = process.cwd();
    const scannedFiles = scanDirectory(projectRoot, 30);
    const repositoryResults = [];
    for (const filePath of scannedFiles) {
        try {
            const content = readFileContent(filePath);
            if (content.length > 0) {
                const result = analyzeFile(filePath, content);
                repositoryResults.push(result);
            }
        }
        catch (error) {
            // Silently skip files that can't be processed
        }
    }
    stats.totalFiles = repositoryResults.length;
    printRepositoryAnalysis(repositoryResults);
    // ========================================================================
    // PART 3: VALIDATION CHECKS
    // ========================================================================
    const validationResults = repositoryResults.map((result) => validateResult(result));
    const validationSummary = printValidationResults(validationResults);
    stats.filesWithIssues = validationSummary.issueCount;
    // Count specific issues
    for (const validation of validationResults) {
        for (const issue of validation.issues) {
            if (issue.includes("Missing primary role"))
                stats.missingRoles++;
            if (issue.includes("Empty role scores"))
                stats.emptyScores++;
            if (issue.includes("Missing priority"))
                stats.missingPriority++;
            if (issue.includes("Suspicious"))
                stats.suspiciousClassifications++;
        }
    }
    // ========================================================================
    // PART 4: HEALTH SCORE CALCULATION
    // ========================================================================
    const customAccuracy = stats.totalCustomTests > 0
        ? (stats.customTestsPassed / stats.totalCustomTests) * 100
        : 100;
    const repositoryHealth = stats.totalFiles > 0
        ? ((stats.totalFiles - stats.filesWithIssues) / stats.totalFiles) * 100
        : 100;
    const weight = 0.4; // Custom tests weight 40%, repository health 60%
    stats.healthScore = customAccuracy * weight + repositoryHealth * (1 - weight);
    printHealthReport(stats);
    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================
    console.log("\n");
    console.log("╔" + "═".repeat(68) + "╗");
    console.log("║" + "  VALIDATION COMPLETE".padEnd(69) + "║");
    console.log("╚" + "═".repeat(68) + "╝");
    console.log("\n");
}
main().catch(console.error);
//# sourceMappingURL=testSystem.js.map