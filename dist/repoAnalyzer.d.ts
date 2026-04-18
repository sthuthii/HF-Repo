/**
 * Repository-level dependency analysis.
 *
 * Identifies key external dependencies, internal architectures,
 * and patterns across the entire codebase.
 */
import { FileClassificationResult } from "./types";
export interface DependencyNode {
    name: string;
    isExternal: boolean;
    count: number;
    files: string[];
    roles: string[];
    criticality: "critical" | "important" | "normal" | "low";
}
export interface RepositoryAnalysis {
    externalDependencies: DependencyNode[];
    internalModules: DependencyNode[];
    keyPatterns: {
        pattern: string;
        count: number;
        roles: string[];
        description: string;
    }[];
    architecturalTiers: {
        tier: string;
        files: string[];
        description: string;
    }[];
    keyFiles: {
        path: string;
        role: string;
        reason: string;
        inDegree: number;
        outDegree: number;
    }[];
}
export declare class RepositoryAnalyzer {
    /**
     * Analyze repository structure to identify key dependencies and patterns.
     */
    static analyze(options: {
        classifications: FileClassificationResult[];
        dependencies: Record<string, string[]>;
        dependents?: Record<string, string[]>;
    }): RepositoryAnalysis;
    /**
     * Extract external (npm, pip, etc.) dependencies.
     */
    private static extractExternalDependencies;
    /**
     * Extract internal modules (./config, ./utils, etc.).
     */
    private static extractInternalDependencies;
    /**
     * Identify architectural patterns in the codebase.
     */
    private static identifyPatterns;
    /**
     * Detect architectural tiers (presentation, business, data, etc.).
     */
    private static detectArchitecturalTiers;
    /**
     * Get tier description.
     */
    private static getTierDescription;
    /**
     * Find key files (hubs with high connectivity).
     */
    private static findKeyFiles;
    /**
     * Get reason why a file is key.
     */
    private static getKeyFileReason;
}
//# sourceMappingURL=repoAnalyzer.d.ts.map