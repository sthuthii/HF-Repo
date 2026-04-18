/**
 * Production Output Integration Example.
 *
 * Demonstrates how to use the new output layer on top of existing analysis.
 * No changes to core logic - this is purely a presentation layer.
 */
import { FileClassificationResult } from "./types";
/**
 * Production output builder.
 * Takes raw analysis and transforms it into user-friendly output.
 */
export declare class ProductionOutput {
    /**
     * Transform raw file classifications into formatted output.
     *
     * Input:
     * - classificationResults: Array of FileClassificationResult from FileClassifier
     * - fileContents: Map of file paths to content (for dependency extraction)
     * - rawDependencies: Map of file paths to dependency strings
     * - dependents: Optional map of file paths to their dependents
     *
     * Output:
     * - Formatted, validated, and highlighted output ready for display
     */
    static transform(options: {
        classificationResults: FileClassificationResult[];
        fileContents?: Record<string, string>;
        rawDependencies?: Record<string, string>;
        dependents?: Record<string, string[]>;
        mockTestAccuracy?: number;
    }): {
        formattedOutput: string;
        healthReport: string;
        issuesReport: string;
        repositorySummary: string;
    };
    /**
     * Determine priority based on confidence and role.
     */
    private static determinePriority;
    /**
     * Build role distribution map.
     */
    private static buildRoleDistribution;
    /**
     * Build summary text.
     */
    private static buildSummary;
    /**
     * Build issues report.
     */
    private static buildIssuesReport;
}
/**
 * Simple CLI example.
 */
export declare function demonstrateProductionOutput(): Promise<void>;
//# sourceMappingURL=productionOutput.d.ts.map