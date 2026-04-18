/**
 * Explanation engine for generating role-specific file descriptions.
 */
import { Role } from "./config";
export declare class ExplanationEngine {
    /**
     * Generate concise, specific explanation for why a file is shown for a role.
     */
    static explainFileRelevance(filePath: string, role: Role, score: number, primaryRole: string, reason?: string): string;
    /**
     * Get role-specific focus areas.
     */
    static getRoleFocus(role: Role | string): string;
    /**
     * Generate a summary for a file based on role.
     */
    static summarizeFileForRole(fileContent: string, role: Role | string, filePath?: string): string;
    /**
     * Explain a data flow path.
     */
    static explainDataFlow(path: string[], sourceFile: string, targetFile: string): string;
}
//# sourceMappingURL=explanationEngine.d.ts.map