/**
 * Suspicious Classification Detection.
 *
 * Flags obviously wrong classifications based on heuristic rules.
 * This adds sanity checking to catch the dogfooding failures.
 */
export interface SuspiciousFlag {
    file: string;
    role: string;
    confidence: number;
    reason: string;
    severity: "warning" | "critical";
    suggestion?: string;
}
export declare class SuspiciousClassifier {
    private static readonly CONFIDENCE_THRESHOLD;
    /**
     * Check if a classification is suspicious.
     */
    static flagSuspicious(file: string, role: string, confidence: number, topScores: Record<string, number>): SuspiciousFlag | null;
    /**
     * Batch check multiple files.
     */
    static flagMultiple(files: Array<{
        file: string;
        role: string;
        confidence: number;
        topScores: Record<string, number>;
    }>): SuspiciousFlag[];
    /**
     * Summarize suspicious findings.
     */
    static summarize(flags: SuspiciousFlag[]): {
        total: number;
        critical: number;
        warnings: number;
        breakdown: Record<string, number>;
    };
}
//# sourceMappingURL=suspiciousClassifier.d.ts.map