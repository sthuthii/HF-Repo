"use strict";
/**
 * Suspicious Classification Detection.
 *
 * Flags obviously wrong classifications based on heuristic rules.
 * This adds sanity checking to catch the dogfooding failures.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuspiciousClassifier = void 0;
const config_1 = require("./config");
class SuspiciousClassifier {
    /**
     * Check if a classification is suspicious.
     */
    static flagSuspicious(file, role, confidence, topScores) {
        // LOW CONFIDENCE: Files scored below 40% are basically guesses
        if (confidence < this.CONFIDENCE_THRESHOLD) {
            // Check if it's a tie situation
            const scores = Object.values(topScores).slice(0, 3);
            const maxDiff = Math.max(...scores) - Math.min(...scores);
            if (maxDiff < 0.05 && scores.length >= 3) {
                return {
                    file,
                    role,
                    confidence,
                    reason: `3-way tie detected (${scores.map((s) => (s * 100).toFixed(1)).join("% = ")}%) - classifier is guessing`,
                    severity: "warning",
                    suggestion: "Mark as AMBIGUOUS or review file manually",
                };
            }
            return {
                file,
                role,
                confidence,
                reason: `Very low confidence (${(confidence * 100).toFixed(1)}%) - model is uncertain`,
                severity: "warning",
                suggestion: "Review classification or improve keywords",
            };
        }
        // FILENAME-BASED HEURISTIC VIOLATIONS
        const fileName = file.split("/").pop()?.toLowerCase() || "";
        // Lockfiles should NEVER be SECURITY
        if (fileName === "package-lock.json" ||
            fileName === "yarn.lock" ||
            fileName === "pnpm-lock.yaml") {
            if (role === config_1.Role.SECURITY) {
                return {
                    file,
                    role,
                    confidence,
                    reason: "Lockfile misclassified as SECURITY (likely keyword false positive)",
                    severity: "critical",
                    suggestion: `Should be DEVOPS or DATA, not SECURITY`,
                };
            }
        }
        // *Classifier.ts or *Graph.ts files should NEVER be QA
        if ((fileName.includes("classifier") ||
            fileName.includes("graph") ||
            fileName.includes("engine")) &&
            !fileName.includes("test") &&
            !fileName.includes("spec")) {
            if (role === config_1.Role.QA) {
                return {
                    file,
                    role,
                    confidence,
                    reason: "Core logic file (*Classifier, *Graph, *Engine) misclassified as QA",
                    severity: "critical",
                    suggestion: `Should be BACKEND, not QA`,
                };
            }
        }
        // Test utility files (.test.ts, .spec.ts) should ALWAYS be QA
        if ((fileName.includes(".test.") || fileName.includes(".spec.")) &&
            role !== config_1.Role.QA) {
            return {
                file,
                role,
                confidence,
                reason: "Test file misclassified as non-QA",
                severity: "critical",
                suggestion: `Should be QA, not ${role}`,
            };
        }
        // Config files should NOT be QA
        if ((fileName === "config.ts" ||
            fileName === "tsconfig.json" ||
            fileName.startsWith("config.")) &&
            role === config_1.Role.QA) {
            return {
                file,
                role,
                confidence,
                reason: "Configuration file misclassified as QA",
                severity: "critical",
                suggestion: `Should be BACKEND or DEVOPS, not QA`,
            };
        }
        // Path-based heuristics
        const pathLower = file.toLowerCase();
        // /test*, /spec*, /e2e*, /__tests__* → should be QA
        if ((pathLower.includes("/test") ||
            pathLower.includes("/spec") ||
            pathLower.includes("/e2e") ||
            pathLower.includes("/__tests__")) &&
            !pathLower.includes(".test.") &&
            role !== config_1.Role.QA &&
            confidence > 0.3) {
            return {
                file,
                role,
                confidence,
                reason: "File in test directory but not classified as QA",
                severity: "warning",
                suggestion: `Likely should be QA`,
            };
        }
        // /src/services/auth* → should be SECURITY
        if (pathLower.includes("auth") && !pathLower.includes("authz")) {
            if (role === config_1.Role.BACKEND && confidence < 0.5) {
                return {
                    file,
                    role,
                    confidence,
                    reason: "Auth-related file classified as BACKEND with low confidence",
                    severity: "warning",
                    suggestion: `Consider SECURITY role`,
                };
            }
        }
        // .py files with "train", "model", "tf.", "torch" → should lean toward AI_ML
        if (fileName.endsWith(".py") &&
            (pathLower.includes("train") ||
                pathLower.includes("model") ||
                pathLower.includes("ml")) &&
            role !== config_1.Role.AI_ML &&
            role !== config_1.Role.DATA) {
            return {
                file,
                role,
                confidence,
                reason: "ML/training script classified as non-ML role",
                severity: "warning",
                suggestion: `Consider AI_ML role`,
            };
        }
        // DATABASE FILES
        if (fileName.endsWith(".sql") ||
            fileName.includes("migration") ||
            fileName.includes("seed")) {
            if (role !== config_1.Role.DATA) {
                return {
                    file,
                    role,
                    confidence,
                    reason: "Database file not classified as DATA",
                    severity: "warning",
                    suggestion: `Should be DATA role`,
                };
            }
        }
        // DOCKERFILE
        if (fileName === "dockerfile" ||
            fileName.includes("docker-compose")) {
            if (role !== config_1.Role.DEVOPS) {
                return {
                    file,
                    role,
                    confidence,
                    reason: "Docker file not classified as DEVOPS",
                    severity: "critical",
                    suggestion: `Should be DEVOPS`,
                };
            }
        }
        // No suspicious flags
        return null;
    }
    /**
     * Batch check multiple files.
     */
    static flagMultiple(files) {
        const flags = [];
        for (const { file, role, confidence, topScores } of files) {
            const flag = this.flagSuspicious(file, role, confidence, topScores);
            if (flag) {
                flags.push(flag);
            }
        }
        return flags;
    }
    /**
     * Summarize suspicious findings.
     */
    static summarize(flags) {
        return {
            total: flags.length,
            critical: flags.filter((f) => f.severity === "critical").length,
            warnings: flags.filter((f) => f.severity === "warning").length,
            breakdown: {
                lowConfidence: flags.filter((f) => f.reason.includes("low confidence")).length,
                tieDetected: flags.filter((f) => f.reason.includes("tie")).length,
                filenameMismatch: flags.filter((f) => f.reason.includes("misclassified")).length,
                pathMismatch: flags.filter((f) => f.reason.includes("file in")).length,
            },
        };
    }
}
exports.SuspiciousClassifier = SuspiciousClassifier;
SuspiciousClassifier.CONFIDENCE_THRESHOLD = 0.40;
//# sourceMappingURL=suspiciousClassifier.js.map