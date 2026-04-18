/**
 * Dependency graph for tracking file imports and relationships.
 */
export declare class DependencyGraph {
    imports: Record<string, Set<string>>;
    importedBy: Record<string, Set<string>>;
    /**
     * Extract imports from file content.
     */
    private extractImports;
    /**
     * Build dependency graph from files.
     */
    buildGraph(files: Record<string, string>): void;
    /**
     * Resolve import path to actual file.
     * Handles relative paths (../hooks/useUser) and bare imports (react).
     */
    private resolveImport;
    /**
     * Get all files that depend on a given file (transitive).
     */
    getDependents(filePath: string, maxDepth?: number): Map<string, number>;
    /**
     * Get all files that this file depends on (transitive).
     */
    getDependencies(filePath: string, maxDepth?: number): Map<string, number>;
    /**
     * Find data flow path from source to target file.
     */
    findDataFlowPath(sourceFile: string, targetFile: string): string[] | null;
    /**
     * Get all data flow paths (BFS).
     */
    getAllDataFlows(sourceFile: string, maxDepth?: number): Array<{
        path: string[];
        confidence: number;
    }>;
    /**
     * Clear the graph.
     */
    clear(): void;
}
//# sourceMappingURL=dependencyGraph.d.ts.map