/**
 * File classification and role scoring system.
 *
 * Assigns relevance scores to files based on:
 * - Path patterns
 * - File type
 * - Content keywords
 * - Dependency relationships
 */
import { Role } from "./config";
import { FileClassificationResult } from "./types";
export declare class FileClassifier {
    private compiledPatterns;
    private fileCache;
    private infrastructureFiles;
    constructor();
    private compilePatterns;
    /**
     * Classify a single file and compute role scores.
     */
    classifyFile(filePath: string, content?: string): FileClassificationResult;
    private applyFileTypeBoosts;
    private capKeywordScores;
    private applyDomainRules;
    private resolveAmbiguousClassification;
    private checkInfrastructureFile;
    private scoreByPath;
    private scoreByType;
    private scoreByKeywords;
    private applySpecialAdjustments;
    private normalizeScores;
    classifyFilesBatch(files: Record<string, string>): FileClassificationResult[];
    getRoleAssociation(filePath: string): Set<Role>;
    clearCache(): void;
}
//# sourceMappingURL=roleClassifier.d.ts.map