/**
 * Production Output Formatter.
 *
 * Transforms raw analysis into clean, user-facing output.
 * Groups files by priority/role, cleans dependencies, and limits results.
 */
import { SuspiciousFlag } from "./suspiciousClassifier";
import { FileClassificationResult } from "./types";
export interface FormattedFile {
    path: string;
    role: string;
    confidence: number;
    priority: "primary" | "supporting" | "context";
    dependencies: string[];
    dependenciesDisplay: string;
    confidence_pct: string;
    explanation?: string;
    suspicious?: SuspiciousFlag;
}
export interface FormattedRoleView {
    role: string;
    totalFiles: number;
    filesInRole: number;
    primary: FormattedFile[];
    supporting: FormattedFile[];
    context: FormattedFile[];
    summary: string;
}
export interface RepositoryOutput {
    summary: string;
    byRole: Record<string, FormattedRoleView>;
    issues: {
        suspicious: SuspiciousFlag[];
        lowConfidence: {
            file: string;
            confidence: number;
        }[];
        tied: {
            file: string;
            roles: string[];
        }[];
    };
    statistics: {
        totalFiles: number;
        roleDistribution: Record<string, number>;
        confidenceStats: {
            avg: number;
            median: number;
            min: number;
            max: number;
        };
    };
}
export declare class OutputFormatter {
    /**
     * Format a single file for display.
     */
    static formatFile(result: FileClassificationResult, priority?: "primary" | "supporting" | "context", dependencies?: string[], suspiciousFlag?: SuspiciousFlag): FormattedFile;
    /**
     * Group files by role and priority.
     */
    static groupByRole(files: Array<{
        result: FileClassificationResult;
        priority: "primary" | "supporting" | "context";
        dependencies: string[];
        suspicious?: SuspiciousFlag;
    }>): Record<string, FormattedRoleView>;
    /**
     * Format a role view for CLI display.
     */
    static formatRoleViewCLI(view: FormattedRoleView, limit?: number): string;
    /**
     * Format a single file line.
     */
    private static formatFileLine;
    /**
     * Format suspicious findings.
     */
    static formatSuspiciousCLI(flags: SuspiciousFlag[]): string;
    /**
     * Format statistics.
     */
    static formatStatisticsCLI(stats: {
        totalFiles: number;
        roleDistribution: Record<string, number>;
        confidenceStats: {
            avg: number;
            median: number;
            min: number;
            max: number;
        };
    }): string;
    /**
     * Format complete repository output.
     */
    static formatRepositoryCLI(repo: RepositoryOutput): string;
}
//# sourceMappingURL=outputFormatter.d.ts.map