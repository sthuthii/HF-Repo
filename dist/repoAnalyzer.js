"use strict";
/**
 * Repository-level dependency analysis.
 *
 * Identifies key external dependencies, internal architectures,
 * and patterns across the entire codebase.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryAnalyzer = void 0;
class RepositoryAnalyzer {
    /**
     * Analyze repository structure to identify key dependencies and patterns.
     */
    static analyze(options) {
        const { classifications, dependencies, dependents = {}, } = options;
        // Extract external vs internal dependencies
        const externalDeps = this.extractExternalDependencies(dependencies, classifications);
        const internalDeps = this.extractInternalDependencies(dependencies, classifications);
        // Identify key patterns
        const patterns = this.identifyPatterns(classifications);
        // Detect architectural tiers
        const tiers = this.detectArchitecturalTiers(classifications, dependencies);
        // Find key files (hubs)
        const keyFiles = this.findKeyFiles(classifications, dependencies, dependents);
        return {
            externalDependencies: externalDeps,
            internalModules: internalDeps,
            keyPatterns: patterns,
            architecturalTiers: tiers,
            keyFiles,
        };
    }
    /**
     * Extract external (npm, pip, etc.) dependencies.
     */
    static extractExternalDependencies(dependencies, classifications) {
        const depMap = new Map();
        // Common external package patterns
        const externalPatterns = [
            /^[a-z0-9-]+$/i, // npm packages
            /^[a-z0-9-]+\/[a-z0-9-]+$/i, // scoped packages
            /^(?!\.\/|\.\.\/)/i, // not relative paths
        ];
        for (const [file, deps] of Object.entries(dependencies)) {
            const fileRole = classifications.find((c) => c.file === file)?.primaryRole;
            for (const dep of deps) {
                // Check if it matches external patterns
                const isExternal = externalPatterns.some((p) => p.test(dep));
                if (isExternal && !dep.includes("./") && !dep.includes("../")) {
                    if (!depMap.has(dep)) {
                        depMap.set(dep, {
                            name: dep,
                            isExternal: true,
                            count: 0,
                            files: [],
                            roles: [],
                            criticality: "normal",
                        });
                    }
                    const node = depMap.get(dep);
                    node.count++;
                    node.files.push(file);
                    if (fileRole && !node.roles.includes(fileRole)) {
                        node.roles.push(fileRole);
                    }
                }
            }
        }
        // Sort by criticality (usage count)
        return Array.from(depMap.values())
            .map((node) => ({
            ...node,
            criticality: (node.count >= 10 ? "critical" :
                node.count >= 5 ? "important" :
                    node.count >= 2 ? "normal" :
                        "low"),
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // Top 20
    }
    /**
     * Extract internal modules (./config, ./utils, etc.).
     */
    static extractInternalDependencies(dependencies, classifications) {
        const depMap = new Map();
        for (const [file, deps] of Object.entries(dependencies)) {
            const fileRole = classifications.find((c) => c.file === file)?.primaryRole;
            for (const dep of deps) {
                // Include relative paths and normalized module names
                if (dep.startsWith("./") ||
                    dep.startsWith("../") ||
                    (!dep.includes("/") && !dep.includes("."))) {
                    // Normalize paths
                    const normalized = dep
                        .replace(/^\.\//, "")
                        .replace(/\.ts$|\.js$|\.tsx$|\.jsx$/, "");
                    if (normalized && normalized !== "." && normalized !== "..") {
                        if (!depMap.has(normalized)) {
                            depMap.set(normalized, {
                                name: normalized,
                                isExternal: false,
                                count: 0,
                                files: [],
                                roles: [],
                                criticality: "normal",
                            });
                        }
                        const node = depMap.get(normalized);
                        node.count++;
                        node.files.push(file);
                        if (fileRole && !node.roles.includes(fileRole)) {
                            node.roles.push(fileRole);
                        }
                    }
                }
            }
        }
        return Array.from(depMap.values())
            .map((node) => ({
            ...node,
            criticality: (node.count >= 20 ? "critical" :
                node.count >= 10 ? "important" :
                    node.count >= 5 ? "normal" :
                        "low"),
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15); // Top 15
    }
    /**
     * Identify architectural patterns in the codebase.
     */
    static identifyPatterns(classifications) {
        const patterns = {};
        for (const result of classifications) {
            const file = result.file.toLowerCase();
            // MVC/Model-View-Controller
            if (file.includes("controller")) {
                if (!patterns["mvc-controller"]) {
                    patterns["mvc-controller"] = {
                        count: 0,
                        roles: new Set(),
                        description: "Controller files (MVC pattern)",
                    };
                }
                patterns["mvc-controller"].count++;
                patterns["mvc-controller"].roles.add(result.primaryRole);
            }
            // Services/Business Logic
            if (file.includes("service") && !file.includes("test")) {
                if (!patterns["service-layer"]) {
                    patterns["service-layer"] = {
                        count: 0,
                        roles: new Set(),
                        description: "Service/business logic layer",
                    };
                }
                patterns["service-layer"].count++;
                patterns["service-layer"].roles.add(result.primaryRole);
            }
            // Middleware
            if (file.includes("middleware")) {
                if (!patterns["middleware"]) {
                    patterns["middleware"] = {
                        count: 0,
                        roles: new Set(),
                        description: "Middleware components",
                    };
                }
                patterns["middleware"].count++;
                patterns["middleware"].roles.add(result.primaryRole);
            }
            // Data Access Layer
            if (file.includes("repo") || file.includes("dao") || file.includes("model")) {
                if (!patterns["data-access"]) {
                    patterns["data-access"] = {
                        count: 0,
                        roles: new Set(),
                        description: "Data access/model layer",
                    };
                }
                patterns["data-access"].count++;
                patterns["data-access"].roles.add(result.primaryRole);
            }
            // Config
            if (file.includes("config")) {
                if (!patterns["configuration"]) {
                    patterns["configuration"] = {
                        count: 0,
                        roles: new Set(),
                        description: "Configuration files",
                    };
                }
                patterns["configuration"].count++;
                patterns["configuration"].roles.add(result.primaryRole);
            }
            // Utilities/Helpers
            if (file.includes("util") || file.includes("helper")) {
                if (!patterns["utilities"]) {
                    patterns["utilities"] = {
                        count: 0,
                        roles: new Set(),
                        description: "Utility/helper functions",
                    };
                }
                patterns["utilities"].count++;
                patterns["utilities"].roles.add(result.primaryRole);
            }
        }
        return Object.entries(patterns)
            .map(([pattern, data]) => ({
            pattern,
            count: data.count,
            roles: Array.from(data.roles),
            description: data.description,
        }))
            .sort((a, b) => b.count - a.count);
    }
    /**
     * Detect architectural tiers (presentation, business, data, etc.).
     */
    static detectArchitecturalTiers(classifications, dependencies) {
        const tiers = {
            presentation: [],
            business: [],
            data: [],
            infrastructure: [],
            testing: [],
        };
        for (const result of classifications) {
            const file = result.file.toLowerCase();
            // Presentation tier: frontend, UI
            if (result.primaryRole === "frontend") {
                tiers.presentation.push(result.file);
            }
            // Business logic tier: backend, full_stack
            if (["backend", "full_stack", "ai_ml"].includes(result.primaryRole)) {
                if (!file.includes("test") && !file.includes("spec")) {
                    tiers.business.push(result.file);
                }
            }
            // Data tier: data, database
            if (result.primaryRole === "data") {
                tiers.data.push(result.file);
            }
            // Infrastructure: devops, security
            if (["devops", "security"].includes(result.primaryRole)) {
                tiers.infrastructure.push(result.file);
            }
            // Testing: qa
            if (result.primaryRole === "qa") {
                tiers.testing.push(result.file);
            }
        }
        return Object.entries(tiers)
            .filter(([_, files]) => files.length > 0)
            .map(([tier, files]) => ({
            tier,
            files: files.slice(0, 5), // Top 5 files per tier
            description: this.getTierDescription(tier),
        }));
    }
    /**
     * Get tier description.
     */
    static getTierDescription(tier) {
        const descriptions = {
            presentation: "UI/Frontend components and views",
            business: "Business logic and core functionality",
            data: "Data access, databases, and storage",
            infrastructure: "DevOps, security, and deployment",
            testing: "Test suites and quality assurance",
        };
        return descriptions[tier] || "";
    }
    /**
     * Find key files (hubs with high connectivity).
     */
    static findKeyFiles(classifications, dependencies, dependents) {
        const keyFiles = new Map();
        // Calculate in-degree (how many files depend on this)
        for (const [file, deps] of Object.entries(dependencies)) {
            for (const dep of deps) {
                const normalized = dep
                    .replace(/^\.\//, "")
                    .replace(/\.ts$|\.js$/, "");
                if (normalized && !keyFiles.has(normalized)) {
                    keyFiles.set(normalized, {
                        path: normalized,
                        role: "",
                        inDegree: 0,
                        outDegree: 0,
                    });
                }
                if (keyFiles.has(normalized)) {
                    keyFiles.get(normalized).inDegree++;
                }
            }
        }
        // Calculate out-degree (how many files this depends on)
        for (const [file, deps] of Object.entries(dependencies)) {
            if (!keyFiles.has(file)) {
                keyFiles.set(file, {
                    path: file,
                    role: "",
                    inDegree: 0,
                    outDegree: 0,
                });
            }
            keyFiles.get(file).outDegree = deps.length;
        }
        // Assign roles
        for (const [file, entry] of keyFiles.entries()) {
            const classification = classifications.find((c) => c.file.includes(file) || file.includes(c.file.split("/").pop() || ""));
            entry.role = classification?.primaryRole || "unknown";
        }
        // Calculate connectivity score and find top files
        return Array.from(keyFiles.values())
            .map((file) => ({
            ...file,
            reason: this.getKeyFileReason(file.inDegree, file.outDegree),
        }))
            .filter((f) => f.inDegree + f.outDegree > 2) // Only files with significant connectivity
            .sort((a, b) => {
            const scoreA = a.inDegree * 2 + a.outDegree; // In-degree weighted more
            const scoreB = b.inDegree * 2 + b.outDegree;
            return scoreB - scoreA;
        })
            .slice(0, 10); // Top 10 key files
    }
    /**
     * Get reason why a file is key.
     */
    static getKeyFileReason(inDegree, outDegree) {
        if (inDegree >= 10) {
            return "Hub file - depended on by many files";
        }
        if (outDegree >= 10) {
            return "Connector file - depends on many files";
        }
        if (inDegree >= 5) {
            return "Core utility - heavily used";
        }
        if (outDegree >= 5) {
            return "Aggregator - orchestrates multiple modules";
        }
        return "Important interconnection point";
    }
}
exports.RepositoryAnalyzer = RepositoryAnalyzer;
//# sourceMappingURL=repoAnalyzer.js.map