/**
 * Tie-Breaker for ambiguous classifications.
 *
 * When multiple roles have equal or very similar scores,
 * use file extension and path heuristics to break ties.
 */
export interface TieBreakerResult {
    role: string;
    confidence: number;
    reason: string;
    isTie: boolean;
    tiedRoles?: string[];
}
export declare class TieBreaker {
    private static readonly TIE_THRESHOLD;
    /**
     * Detect if scores are tied.
     */
    static detectTie(scores: Record<string, number>): {
        isTie: boolean;
        tiedRoles: string[];
        maxScore: number;
    };
    /**
     * Break a tie using file characteristics.
     */
    static breakTie(file: string, tiedRoles: string[], scores: Record<string, number>): TieBreakerResult;
    /**
     * Get role hints from file extension.
     */
    private static getExtensionHints;
    /**
     * Get role hints from file path.
     */
    private static getPathHints;
    /**
     * Get role hints from filename.
     */
    private static getFilenameHints;
    /**
     * Extract the clue from the path for explanation.
     */
    private static extractPathClue;
}
//# sourceMappingURL=tieBreaker.d.ts.map