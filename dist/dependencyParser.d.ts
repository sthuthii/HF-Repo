/**
 * Clean dependency extraction output.
 *
 * Fixes the broken dependency parser that leaks syntax tokens.
 * Removes: quotes, semicolons, curly braces, and other syntax artifacts.
 */
export declare class DependencyParser {
    /**
     * Clean a raw dependency string.
     * Removes quotes, semicolons, curly braces, and other syntax tokens.
     */
    static cleanDependency(raw: string): string;
    /**
     * Parse and clean a full dependency list string.
     * Input: "dotenv/config, {, "./config";"
     * Output: ["dotenv/config", "./config"]
     */
    static parseDependencyList(raw: string): string[];
    /**
     * Format dependencies for display.
     * Limits to max 5, joins with commas.
     */
    static formatForDisplay(deps: string[], maxCount?: number): string;
    /**
     * Extract unique module names from dependency paths.
     * Input: ["./config", "lodash", "@types/node", "./utils/helpers"]
     * Output: ["config", "lodash", "types/node", "utils"]
     */
    static extractModuleNames(deps: string[]): Set<string>;
    /**
     * Categorize dependencies by type.
     */
    static categorizeDependencies(deps: string[]): {
        local: string[];
        external: string[];
        scoped: string[];
    };
}
//# sourceMappingURL=dependencyParser.d.ts.map