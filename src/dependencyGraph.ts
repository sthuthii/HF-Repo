/**
 * Dependency graph for tracking file imports and relationships.
 */

import { DependencyInfo } from "./types";

export class DependencyGraph {
  imports: Record<string, Set<string>> = {}; // file -> set of imported files
  importedBy: Record<string, Set<string>> = {}; // file -> set of files that import it

  /**
   * Extract imports from file content.
   */
  private extractImports(content: string): Set<string> {
    const imports = new Set<string>();
     const strippedContent = content.replace(/\/\/.*$/gm, '');
    // JavaScript/TypeScript imports
    const jsImports = strippedContent.match(
      /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g
    ) || [];
    for (const imp of jsImports) {
      const match = imp.match(/['"]([^'"]+)['"]/);
      if (match) imports.add(match[1]);
    }

    // Python imports
    const pyImports = content.match(/(?:from|import)\s+([^\s;]+)/g) || [];
    for (const imp of pyImports) {
      const parts = imp.replace(/^(?:from|import)\s+/, "").trim();
      if (parts) imports.add(parts);
    }

    return imports;
  }

  /**
   * Build dependency graph from files.
   */
  buildGraph(files: Record<string, string>): void {
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
  private resolveImport(
    importPath: string,
    fromFile: string,
    fileList: string[]
  ): string | null {
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
      } else if (resolvedPath.startsWith("./")) {
        resolvedPath = fromDir + "/" + resolvedPath.substring(2);
      }

      // Try to find the file
      for (const file of fileList) {
        if (
          file.startsWith(resolvedPath) ||
          file === resolvedPath ||
          file === resolvedPath + ".ts" ||
          file === resolvedPath + ".js" ||
          file === resolvedPath + ".tsx" ||
          file === resolvedPath + ".jsx"
        ) {
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
  getDependents(
    filePath: string,
    maxDepth: number = 2
  ): Map<string, number> {
    const dependents = new Map<string, number>();

    const visit = (file: string, depth: number) => {
      if (depth > maxDepth) return;

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
  getDependencies(
    filePath: string,
    maxDepth: number = 2
  ): Map<string, number> {
    const dependencies = new Map<string, number>();

    const visit = (file: string, depth: number) => {
      if (depth > maxDepth) return;

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
  findDataFlowPath(
    sourceFile: string,
    targetFile: string
  ): string[] | null {
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (current: string): boolean => {
      if (visited.has(current)) return false;
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
  getAllDataFlows(
    sourceFile: string,
    maxDepth: number = 2
  ): Array<{ path: string[]; confidence: number }> {
    const flows: Array<{ path: string[]; confidence: number }> = [];
    const visited = new Set<string>();

    const bfs = (startFile: string) => {
      const queue: Array<[string, string[]]> = [[startFile, [startFile]]];
      let depth = 0;

      while (queue.length > 0 && depth < maxDepth) {
        const nextQueue: Array<[string, string[]]> = [];

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
  clear(): void {
    this.imports = {};
    this.importedBy = {};
  }
}
