/**
 * Clean dependency extraction output.
 * 
 * Fixes the broken dependency parser that leaks syntax tokens.
 * Removes: quotes, semicolons, curly braces, and other syntax artifacts.
 */

export class DependencyParser {
  /**
   * Clean a raw dependency string.
   * Removes quotes, semicolons, curly braces, and other syntax tokens.
   */
  static cleanDependency(raw: string): string {
    // Remove quotes (both single and double)
    let cleaned = raw.replace(/['"]/g, "");

    // Remove semicolons
    cleaned = cleaned.replace(/;/g, "");

    // Remove standalone curly braces (from destructuring)
    cleaned = cleaned.replace(/^[\s{]+/, "").replace(/[\s}]+$/, "");

    // Trim whitespace
    cleaned = cleaned.trim();

    // Remove commas at end
    cleaned = cleaned.replace(/,+$/, "");

    // If it's empty or just ellipsis, skip it
    if (!cleaned || cleaned === "..." || cleaned === ".") {
      return "";
    }

    return cleaned;
  }

  /**
   * Parse and clean a full dependency list string.
   * Input: "dotenv/config, {, "./config";"
   * Output: ["dotenv/config", "./config"]
   */
  static parseDependencyList(raw: string): string[] {
    if (!raw || typeof raw !== "string") {
      return [];
    }

    // Split by common delimiters
    const parts = raw
      .split(/[,;]/g)
      .map((part) => this.cleanDependency(part))
      .filter((dep) => dep.length > 0)
      .filter((dep, idx, arr) => arr.indexOf(dep) === idx); // Remove duplicates

    return parts;
  }

  /**
   * Format dependencies for display.
   * Limits to max 5, joins with commas.
   */
  static formatForDisplay(deps: string[], maxCount: number = 5): string {
    if (!deps || deps.length === 0) {
      return "none";
    }

    const limited = deps.slice(0, maxCount);
    return limited.join(", ") + (deps.length > maxCount ? ", ..." : "");
  }

  /**
   * Extract unique module names from dependency paths.
   * Input: ["./config", "lodash", "@types/node", "./utils/helpers"]
   * Output: ["config", "lodash", "types/node", "utils"]
   */
  static extractModuleNames(deps: string[]): Set<string> {
    const modules = new Set<string>();

    for (const dep of deps) {
      // Handle relative paths
      if (dep.startsWith(".")) {
        const cleaned = dep.replace(/^\.\//, "").split("/")[0];
        if (cleaned) modules.add(cleaned);
      } else {
        // Handle scoped packages and regular imports
        const firstPart = dep.split("/")[0];
        if (firstPart && !firstPart.startsWith("{")) {
          modules.add(firstPart);
        }
      }
    }

    return modules;
  }

  /**
   * Categorize dependencies by type.
   */
  static categorizeDependencies(deps: string[]): {
    local: string[];
    external: string[];
    scoped: string[];
  } {
    const result = {
      local: [] as string[],
      external: [] as string[],
      scoped: [] as string[],
    };

    for (const dep of deps) {
      if (dep.startsWith(".")) {
        result.local.push(dep);
      } else if (dep.startsWith("@")) {
        result.scoped.push(dep);
      } else {
        result.external.push(dep);
      }
    }

    return result;
  }
}
