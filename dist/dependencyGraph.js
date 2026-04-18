"use strict";
/**
 * Dependency graph for tracking file imports and relationships.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyGraph = void 0;
class DependencyGraph {
    constructor() {
        this.imports = {}; // file -> set of imported files
        this.importedBy = {}; // file -> set of files that import it
    }
    /**
     * Extract imports from file content.
     */
    extractImports(content) {
        const imports = new Set();
        const strippedContent = content.replace(/\/\/.*$/gm, '');
        // JavaScript/TypeScript imports
        const jsImports = strippedContent.match(/(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g) || [];
        for (const imp of jsImports) {
            const match = imp.match(/['"]([^'"]+)['"]/);
            if (match)
                imports.add(match[1]);
        }
        // Python imports
        const pyImports = content.match(/(?:from|import)\s+([^\s;]+)/g) || [];
        for (const imp of pyImports) {
            const parts = imp.replace(/^(?:from|import)\s+/, "").trim();
            if (parts)
                imports.add(parts);
        }
        return imports;
    }
    /**
     * Build dependency graph from files.
     */
    buildGraph(files) {
        const fileList = Object.keys(files);
        // Initialize
        for (const file of fileList) {
            this.imports[file] = new Set();
            this.importedBy[file] = new Set();
        }
        // Extract dependencies
        for (const [filePath, content] of Object.entries(files)) {
            const importsRaw = this.extractImports(content);
            for (const importPath of importsRaw) {
                // Try to resolve relative imports
                const resolved = this.resolveImport(importPath, filePath, fileList);
                if (resolved) {
                    this.imports[filePath].add(resolved);
                    if (!this.importedBy[resolved]) {
                        this.importedBy[resolved] = new Set();
                    }
                    this.importedBy[resolved].add(filePath);
                }
            }
        }
    }
    /**
     * Resolve import path to actual file.
     * Handles relative paths (../hooks/useUser) and bare imports (react).
     */
    resolveImport(importPath, fromFile, fileList) {
        // Handle relative imports
        if (importPath.startsWith(".")) {
            const fromDir = fromFile.substring(0, fromFile.lastIndexOf("/"));
            let resolvedPath = importPath;
            // Normalize the path
            if (resolvedPath.startsWith("../")) {
                const parts = fromDir.split("/");
                let remaining = resolvedPath;
                while (remaining.startsWith("../") && parts.length > 0) {
                    parts.pop();
                    remaining = remaining.substring(3);
                }
                resolvedPath = parts.join("/") + "/" + remaining;
            }
            else if (resolvedPath.startsWith("./")) {
                resolvedPath = fromDir + "/" + resolvedPath.substring(2);
            }
            // Try to find the file
            for (const file of fileList) {
                if (file.startsWith(resolvedPath) ||
                    file === resolvedPath ||
                    file === resolvedPath + ".ts" ||
                    file === resolvedPath + ".js" ||
                    file === resolvedPath + ".tsx" ||
                    file === resolvedPath + ".jsx") {
                    return file;
                }
            }
        }
        // Bare imports (react, express, etc.) - try to find in common locations
        for (const file of fileList) {
            const fileName = file.split("/").pop() || "";
            if (fileName.startsWith(importPath)) {
                return file;
            }
        }
        return null;
    }
    /**
     * Get all files that depend on a given file (transitive).
     */
    getDependents(filePath, maxDepth = 2) {
        const dependents = new Map();
        const visit = (file, depth) => {
            if (depth > maxDepth)
                return;
            const directDependents = this.importedBy[file] || new Set();
            for (const dependent of directDependents) {
                if (!dependents.has(dependent)) {
                    dependents.set(dependent, depth);
                    visit(dependent, depth + 1);
                }
            }
        };
        visit(filePath, 1);
        return dependents;
    }
    /**
     * Get all files that this file depends on (transitive).
     */
    getDependencies(filePath, maxDepth = 2) {
        const dependencies = new Map();
        const visit = (file, depth) => {
            if (depth > maxDepth)
                return;
            const directDependencies = this.imports[file] || new Set();
            for (const dependency of directDependencies) {
                if (!dependencies.has(dependency)) {
                    dependencies.set(dependency, depth);
                    visit(dependency, depth + 1);
                }
            }
        };
        visit(filePath, 1);
        return dependencies;
    }
    /**
     * Find data flow path from source to target file.
     */
    findDataFlowPath(sourceFile, targetFile) {
        const visited = new Set();
        const path = [];
        const dfs = (current) => {
            if (visited.has(current))
                return false;
            visited.add(current);
            path.push(current);
            if (current === targetFile) {
                return true;
            }
            const dependencies = this.imports[current] || new Set();
            for (const dep of dependencies) {
                if (dfs(dep)) {
                    return true;
                }
            }
            path.pop();
            return false;
        };
        if (dfs(sourceFile)) {
            return path;
        }
        return null;
    }
    /**
     * Get all data flow paths (BFS).
     */
    getAllDataFlows(sourceFile, maxDepth = 2) {
        const flows = [];
        const visited = new Set();
        const bfs = (startFile) => {
            const queue = [[startFile, [startFile]]];
            let depth = 0;
            while (queue.length > 0 && depth < maxDepth) {
                const nextQueue = [];
                for (const [current, currentPath] of queue) {
                    const dependencies = this.imports[current] || new Set();
                    for (const dep of dependencies) {
                        const newPath = [...currentPath, dep];
                        flows.push({
                            path: newPath,
                            confidence: 1.0 / (newPath.length - 1), // Deeper paths have lower confidence
                        });
                        if (!visited.has(dep)) {
                            visited.add(dep);
                            nextQueue.push([dep, newPath]);
                        }
                    }
                }
                queue.length = 0;
                queue.push(...nextQueue);
                depth++;
            }
        };
        bfs(sourceFile);
        return flows;
    }
    /**
     * Clear the graph.
     */
    clear() {
        this.imports = {};
        this.importedBy = {};
    }
}
exports.DependencyGraph = DependencyGraph;
//# sourceMappingURL=dependencyGraph.js.map