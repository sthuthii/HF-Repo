/**
 * Repository summary generator.
 *
 * Creates a high-level overview of the repository:
 * - What types of files exist
 * - What are the key architectural patterns
 * - What's the main tech stack
 * - What are critical areas to understand
 */
import { FileClassificationResult } from "./types";
import { RepositoryAnalysis } from "./repoAnalyzer";
export interface RepositorySummary {
    overview: string;
    description: string;
    architecture: string;
    keyTechnologies: string[];
    criticalFiles: string[];
    architecturalLayers: string[];
    recommendations: string[];
    complexity: "simple" | "moderate" | "complex" | "very-complex";
}
export declare class RepositorySummaryGenerator {
    /**
     * Generate a comprehensive repository summary.
     */
    static generate(options: {
        classifications: FileClassificationResult[];
        dependencies: Record<string, string[]>;
        dependents?: Record<string, string[]>;
        analysis?: RepositoryAnalysis;
    }): RepositorySummary;
    /**
     * Calculate statistics about the repository.
     */
    private static calculateStatistics;
    /**
     * Determine the overall architecture type.
     */
    private static determineArchitecture;
    /**
     * Extract key technologies from dependencies.
     */
    private static extractKeyTechnologies;
    /**
     * Generate one-line overview.
     */
    private static generateOverview;
    /**
     * Generate 2-3 sentence description.
     */
    private static generateDescription;
    /**
     * Generate recommendations.
     */
    private static generateRecommendations;
    /**
     * Determine overall complexity level.
     */
    private static determineComplexity;
    /**
     * Format summary for CLI display.
     */
    static formatForCLI(summary: RepositorySummary): string;
}
//# sourceMappingURL=repositorySummary.d.ts.map