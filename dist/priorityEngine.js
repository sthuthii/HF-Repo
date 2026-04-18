"use strict";
/**
 * Priority assignment and bucketing engine.
 *
 * Converts role scores into priority buckets:
 * - PRIMARY (0.7 – 1.0): Must understand
 * - SUPPORTING (0.4 – 0.7): Related logic
 * - CONTEXT (0.1 – 0.4): Additional context
 * - HIDDEN (0.0 – 0.1): Not shown by default
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityEngine = exports.PrioritizedFileImpl = void 0;
const config_1 = require("./config");
class PrioritizedFileImpl {
    constructor(filePath, score, priority, roles) {
        this.filePath = filePath;
        this.score = score;
        this.priority = priority;
        this.roles = roles;
    }
    // Alias for filePath for compatibility
    get path() {
        return this.filePath;
    }
    toDict() {
        return {
            file: this.filePath,
            path: this.filePath,
            score: this.score,
            priority: this.priority,
            roles: Array.from(this.roles).map((r) => r.toString()),
            reason: this.reason || "",
            confidence: this.confidence || 1.0,
            explanation: this.explanation || "",
            hasDependencies: this.hasDependencies || false,
            hasDependents: this.hasDependents || false,
        };
    }
}
exports.PrioritizedFileImpl = PrioritizedFileImpl;
class PriorityEngine {
    /**
     * Assign priority bucket based on score.
     */
    static assignPriority(score) {
        for (const [priority, [minVal, maxVal]] of Object.entries(config_1.PRIORITY_THRESHOLDS)) {
            if (score >= minVal && score <= maxVal) {
                return priority;
            }
        }
        return "hidden";
    }
    /**
     * Create prioritized view for a specific role.
     */
    static createRoleView(role, fileScores, dependencies) {
        const view = {
            primary: [],
            supporting: [],
            context: [],
        };
        // Score files for this role
        const scoredFiles = [];
        for (const [filePath, scores] of Object.entries(fileScores)) {
            const roleScore = scores[role] || 0.0;
            if (roleScore > 0.0) {
                // Get all roles this file is relevant to (score > 0.3)
                const relevantRoles = new Set();
                for (const [r, score] of Object.entries(scores)) {
                    if (score > 0.3) {
                        relevantRoles.add(r);
                    }
                }
                scoredFiles.push([filePath, roleScore, relevantRoles]);
            }
        }
        // Sort by score descending
        scoredFiles.sort(([, a], [, b]) => b - a);
        // Assign to priority buckets
        for (const [filePath, score, roles] of scoredFiles) {
            const priority = PriorityEngine.assignPriority(score);
            if (priority !== "hidden") {
                const pf = new PrioritizedFileImpl(filePath, score, priority, roles);
                if (dependencies) {
                    pf.hasDependencies = Boolean(dependencies[filePath]?.size);
                }
                view[priority].push(pf);
            }
        }
        // Limit results
        for (const priority of ["primary", "supporting", "context"]) {
            view[priority] = view[priority].slice(0, config_1.MAX_FILES_PER_PRIORITY);
        }
        return view;
    }
    /**
     * Merge views from multiple roles.
     */
    static mergeMultiRoleView(roles, fileScores, dependencies, mergeStrategy = "max") {
        const view = {
            primary: [],
            supporting: [],
            context: [],
        };
        // Compute merged scores
        const mergedScores = {};
        for (const [filePath, scores] of Object.entries(fileScores)) {
            const roleScores = roles.map((r) => scores[r] || 0.0);
            let mergedScore;
            if (mergeStrategy === "max") {
                mergedScore = Math.max(...roleScores);
            }
            else if (mergeStrategy === "average") {
                mergedScore = roleScores.reduce((a, b) => a + b, 0) / roles.length;
            }
            else {
                // weighted
                const relevantCount = roleScores.filter((s) => s > 0).length;
                mergedScore =
                    (roleScores.reduce((a, b) => a + b, 0) / roles.length) *
                        (relevantCount / roles.length);
            }
            mergedScores[filePath] = mergedScore;
        }
        // Create view using merged scores
        const scoredFiles = [];
        for (const [filePath, score] of Object.entries(mergedScores)) {
            if (score > 0.0) {
                scoredFiles.push([filePath, score]);
            }
        }
        scoredFiles.sort(([, a], [, b]) => b - a);
        // Assign to priority buckets
        for (const [filePath, score] of scoredFiles) {
            const priority = PriorityEngine.assignPriority(score);
            if (priority !== "hidden") {
                // Get roles this file is relevant to
                const relevantRoles = new Set();
                for (const r of roles) {
                    if (fileScores[filePath][r] > 0.3) {
                        relevantRoles.add(r);
                    }
                }
                const pf = new PrioritizedFileImpl(filePath, score, priority, relevantRoles);
                if (dependencies) {
                    pf.hasDependencies = Boolean(dependencies[filePath]?.size);
                }
                view[priority].push(pf);
            }
        }
        // Limit results
        for (const priority of ["primary", "supporting", "context"]) {
            view[priority] = view[priority].slice(0, config_1.MAX_FILES_PER_PRIORITY);
        }
        return view;
    }
}
exports.PriorityEngine = PriorityEngine;
//# sourceMappingURL=priorityEngine.js.map