"use strict";
/**
 * Tie-Breaker for ambiguous classifications.
 *
 * When multiple roles have equal or very similar scores,
 * use file extension and path heuristics to break ties.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TieBreaker = void 0;
const config_1 = require("./config");
class TieBreaker {
    /**
     * Detect if scores are tied.
     */
    static detectTie(scores) {
        const entries = Object.entries(scores).sort(([, a], [, b]) => b - a);
        if (entries.length < 2) {
            return { isTie: false, tiedRoles: [], maxScore: entries[0]?.[1] || 0 };
        }
        const [topRole, topScore] = entries[0];
        const secondScore = entries[1][1];
        const diff = topScore - secondScore;
        if (diff < this.TIE_THRESHOLD) {
            // Collect all tied roles (within threshold)
            const tiedRoles = entries
                .filter(([, score]) => score >= topScore - this.TIE_THRESHOLD)
                .map(([role]) => role);
            return { isTie: true, tiedRoles, maxScore: topScore };
        }
        return { isTie: false, tiedRoles: [], maxScore: topScore };
    }
    /**
     * Break a tie using file characteristics.
     */
    static breakTie(file, tiedRoles, scores) {
        if (tiedRoles.length === 1) {
            // Not actually a tie, just pick the one
            const role = tiedRoles[0];
            return {
                role,
                confidence: scores[role],
                reason: "No tie",
                isTie: false,
            };
        }
        const fileLower = file.toLowerCase();
        const fileName = file.split("/").pop()?.toLowerCase() || "";
        const ext = fileName.split(".").pop() || "";
        // EXTENSION-BASED HEURISTICS
        const extHints = this.getExtensionHints(ext);
        for (const role of extHints) {
            if (tiedRoles.includes(role)) {
                return {
                    role,
                    confidence: scores[role],
                    reason: `Extension .${ext} suggests ${role}`,
                    isTie: true,
                    tiedRoles,
                };
            }
        }
        // PATH-BASED HEURISTICS
        const pathHints = this.getPathHints(fileLower);
        for (const role of pathHints) {
            if (tiedRoles.includes(role)) {
                return {
                    role,
                    confidence: scores[role],
                    reason: `Path contains "${this.extractPathClue(fileLower)}" → ${role}`,
                    isTie: true,
                    tiedRoles,
                };
            }
        }
        // FILENAME-BASED HEURISTICS
        const nameHints = this.getFilenameHints(fileName);
        for (const role of nameHints) {
            if (tiedRoles.includes(role)) {
                return {
                    role,
                    confidence: scores[role],
                    reason: `Filename pattern suggests ${role}`,
                    isTie: true,
                    tiedRoles,
                };
            }
        }
        // If no heuristic matches, pick the first tied role and mark as AMBIGUOUS
        const fallback = tiedRoles[0];
        return {
            role: fallback,
            confidence: scores[fallback],
            reason: `Ambiguous tie between ${tiedRoles.join(", ")} - defaulted to ${fallback}`,
            isTie: true,
            tiedRoles,
        };
    }
    /**
     * Get role hints from file extension.
     */
    static getExtensionHints(ext) {
        const hints = {
            py: [config_1.Role.AI_ML, config_1.Role.DATA, config_1.Role.BACKEND],
            sql: [config_1.Role.DATA, config_1.Role.BACKEND],
            test: [config_1.Role.QA, config_1.Role.BACKEND],
            spec: [config_1.Role.QA, config_1.Role.FRONTEND],
            yaml: [config_1.Role.DEVOPS, config_1.Role.DATA],
            yml: [config_1.Role.DEVOPS, config_1.Role.DATA],
            json: [config_1.Role.BACKEND, config_1.Role.DEVOPS],
            tsx: [config_1.Role.FRONTEND, config_1.Role.FULL_STACK],
            jsx: [config_1.Role.FRONTEND],
            ts: [config_1.Role.BACKEND, config_1.Role.FRONTEND],
            js: [config_1.Role.BACKEND, config_1.Role.FRONTEND],
        };
        return hints[ext.toLowerCase()] || [];
    }
    /**
     * Get role hints from file path.
     */
    static getPathHints(fileLower) {
        if (fileLower.includes("test") || fileLower.includes("spec")) {
            return [config_1.Role.QA];
        }
        if (fileLower.includes("component")) {
            return [config_1.Role.FRONTEND];
        }
        if (fileLower.includes("service")) {
            return [config_1.Role.BACKEND];
        }
        if (fileLower.includes("model")) {
            return [config_1.Role.AI_ML, config_1.Role.BACKEND];
        }
        if (fileLower.includes("data")) {
            return [config_1.Role.DATA, config_1.Role.BACKEND];
        }
        if (fileLower.includes("infra") || fileLower.includes("deploy")) {
            return [config_1.Role.DEVOPS];
        }
        return [];
    }
    /**
     * Get role hints from filename.
     */
    static getFilenameHints(fileName) {
        if (fileName.includes(".test.") ||
            fileName.includes(".spec.") ||
            fileName.startsWith("test")) {
            return [config_1.Role.QA];
        }
        if (fileName.endsWith("component.tsx") ||
            fileName.endsWith("component.jsx")) {
            return [config_1.Role.FRONTEND];
        }
        if (fileName.includes("config")) {
            return [config_1.Role.BACKEND, config_1.Role.DEVOPS];
        }
        if (fileName.includes("index")) {
            return []; // Index files are ambiguous
        }
        return [];
    }
    /**
     * Extract the clue from the path for explanation.
     */
    static extractPathClue(fileLower) {
        const clues = [
            "test",
            "spec",
            "component",
            "service",
            "model",
            "data",
            "infra",
            "deploy",
        ];
        for (const clue of clues) {
            if (fileLower.includes(clue)) {
                return clue;
            }
        }
        return "path";
    }
}
exports.TieBreaker = TieBreaker;
TieBreaker.TIE_THRESHOLD = 0.05;
//# sourceMappingURL=tieBreaker.js.map