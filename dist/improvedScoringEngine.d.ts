export interface ScoredFile {
    file: string;
    fileType: string;
    primaryRole: string;
    scores: Record<string, number>;
    confidence: number;
}
export declare function scoreFile(filePath: string, content: string): ScoredFile;
//# sourceMappingURL=improvedScoringEngine.d.ts.map