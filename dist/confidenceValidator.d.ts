/**
 * Confidence Validator.
 *
 * Computes honest health metrics based on real confidence levels,
 * not just test pass rates.
 */
export interface HealthReport {
    mockTestAccuracy: number;
    realWorldConfidence: number;
    suspiciousFlags: number;
    overallHealth: number;
    healthLabel: "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL" | "UNKNOWN";
    recommendedActions: string[];
    details: {
        filesAnalyzed: number;
        filesWithLowConfidence: number;
        filesWithMediumConfidence: number;
        filesWithHighConfidence: number;
        avgConfidence: number;
        medianConfidence: number;
        minConfidence: number;
        maxConfidence: number;
    };
}
export declare class ConfidenceValidator {
    /**
     * Compute honest health report based on real data.
     */
    static computeHealth(options: {
        mockTestAccuracy?: number;
        fileConfidences: number[];
        suspiciousFlags?: number;
    }): HealthReport;
    /**
     * Format health report as a readable string.
     */
    static formatReport(report: HealthReport): string;
    /**
     * Build a visual health bar.
     */
    static buildHealthBar(score: number): string;
    /**
     * Get emoji for status.
     */
    static getStatusEmoji(status: HealthReport["healthLabel"]): string;
}
//# sourceMappingURL=confidenceValidator.d.ts.map