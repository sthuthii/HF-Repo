/**
 * Enhanced Production Output Formatter.
 * 
 * Transforms raw analysis into clean, scannable, user-facing output.
 * - Groups files by priority/role
 * - Cleans dependencies with no syntax artifacts
 * - Limits results for readability (INFORMATION OVERLOAD PREVENTION)
 * - Clear visual hierarchy
 * - Role-specific context
 */

import { DependencyParser } from "./dependencyParser";
import { SuspiciousClassifier, SuspiciousFlag } from "./suspiciousClassifier";
import { TieBreaker } from "./tieBreaker";
import { FileClassificationResult } from "./types";

export interface FormattedFile {
  path: string;
  role: string;
  confidence: number;
  priority: "primary" | "supporting" | "context"; // Relative to a specific role
  dependencies: string[];
  dependenciesDisplay: string;
  confidence_pct: string;
  explanation?: string;
  suspicious?: SuspiciousFlag;
}

export interface FormattedRoleView {
  role: string;
  totalFiles: number;
  filesInRole: number;
  primary: FormattedFile[];
  supporting: FormattedFile[];
  context: FormattedFile[];
  summary: string;
}

export interface RepositoryOutput {
  summary: string;
  byRole: Record<string, FormattedRoleView>;
  issues: {
    suspicious: SuspiciousFlag[];
    lowConfidence: { file: string; confidence: number }[];
    tied: { file: string; roles: string[] }[];
  };
  statistics: {
    totalFiles: number;
    roleDistribution: Record<string, number>;
    confidenceStats: {
      avg: number;
      median: number;
      min: number;
      max: number;
    };
  };
}

/**
 * INFORMATION OVERLOAD LIMITS
 */
const LIMITS = {
  PRIMARY_FILES: 5,      // Show max 5 primary files
  SUPPORTING_FILES: 7,   // Show max 7 supporting files
  CONTEXT_FILES: 3,      // Show max 3 context files
  DEPENDENCIES_PER_FILE: 3,  // Show max 3 deps
  TOTAL_PER_ROLE: 15,    // Total max per role
};

export class OutputFormatter {
  /**
   * Format a single file for display.
   */
  static formatFile(
    result: FileClassificationResult,
    priority: "primary" | "supporting" | "context" = "supporting",
    dependencies: string[] = [],
    suspiciousFlag?: SuspiciousFlag
  ): FormattedFile {
    const cleanDeps = dependencies
      .slice(0, LIMITS.DEPENDENCIES_PER_FILE)
      .map((dep) => DependencyParser.cleanDependency(dep))
      .filter((dep) => dep !== "")
      // THE GARBAGE FILTER: Drop anything with parentheses, spaces, or periods
      .filter((dep) => !/[\(\)\. ]/.test(dep)); 

    return {
      path: result.file,
      role: result.primaryRole,
      confidence: result.confidence,
      priority,
      dependencies: cleanDeps,
      dependenciesDisplay: DependencyParser.formatForDisplay(cleanDeps, LIMITS.DEPENDENCIES_PER_FILE),
      confidence_pct: `${(result.confidence * 100).toFixed(1)}%`,
      suspicious: suspiciousFlag,
      explanation: "",
    };
  }

  /**
   * Format role view for CLI display with clean hierarchy
   */
  static formatRoleViewForCLI(
    role: string,
    primary: FormattedFile[],
    supporting: FormattedFile[],
    context: FormattedFile[],
    totalFiles: number
  ): string {
    let output = "";

    // Header
    output += `\n${"═".repeat(70)}\n`;
    output += `  VIEW: ${role.toUpperCase()} ENGINEER\n`;
    output += `${"═".repeat(70)}\n\n`;

    // Summary
    const primaryCount = Math.min(primary.length, LIMITS.PRIMARY_FILES);
    const supportingCount = Math.min(supporting.length, LIMITS.SUPPORTING_FILES);
    const contextCount = Math.min(context.length, LIMITS.CONTEXT_FILES);
    const total = primaryCount + supportingCount + contextCount;

    output += `📊 Summary: ${primaryCount} primary • ${supportingCount} supporting • ${contextCount} context\n`;
    output += `   (showing ${total}/${totalFiles} files, focused on relevance)\n\n`;

    // PRIMARY FILES
    if (primary.length > 0) {
      output += `${"─".repeat(70)}\n`;
      output += `✅ PRIMARY (Must understand - ${primaryCount} files)\n`;
      output += `${"─".repeat(70)}\n`;
      
      primary.slice(0, LIMITS.PRIMARY_FILES).forEach((file, idx) => {
        output += `\n  ${(idx + 1).toString().padEnd(2)}. ${file.path}\n`;
        output += `      Confidence: ${file.confidence_pct}\n`;
        if (file.explanation) {
          output += `      Why: ${file.explanation}\n`;
        }
        if (file.dependencies.length > 0) {
          output += `      Depends on: ${file.dependencies.join(", ")}\n`;
        }
      });
      output += "\n";
    }

    // SUPPORTING FILES
    if (supporting.length > 0) {
      output += `${"─".repeat(70)}\n`;
      output += `🔧 SUPPORTING (Related logic - ${supportingCount} files)\n`;
      output += `${"─".repeat(70)}\n`;
      
      supporting.slice(0, LIMITS.SUPPORTING_FILES).forEach((file) => {
        output += `  • ${file.path}\n`;
        output += `    ${file.confidence_pct} • ${file.explanation || "Related dependency"}\n`;
      });
      output += "\n";
    }

    // CONTEXT FILES
    if (context.length > 0) {
      output += `${"─".repeat(70)}\n`;
      output += `📚 CONTEXT (Reference - ${contextCount} files)\n`;
      output += `${"─".repeat(70)}\n`;
      
      context.slice(0, LIMITS.CONTEXT_FILES).forEach((file) => {
        output += `  • ${file.path} (${file.confidence_pct})\n`;
      });
      output += "\n";
    }

    // Footer with navigation hints
    output += `${"─".repeat(70)}\n`;
    output += `💡 Next: Review primary files first, then explore supporting dependencies\n`;
    output += `═`.repeat(70) + "\n";

    return output;
  }

  /**
   * Format all role views for complete CLI display
   */
  static formatAllRoleViewsCLI(roleViews: Record<string, FormattedRoleView>): string {
    let output = "";

    // Main title
    output += `\n${"=".repeat(70)}\n`;
    output += `  REPOMAP: ROLE-BASED REPOSITORY ANALYSIS\n`;
    output += `${"=".repeat(70)}\n\n`;

    // Quick reference
    const roles = Object.keys(roleViews);
    output += `📋 Quick Reference (${roles.length} roles analyzed):\n`;
    roles.forEach((role) => {
      const view = roleViews[role];
      output += `   • ${role}: ${view.primary.length} primary, ${view.supporting.length} supporting\n`;
    });
    output += "\n";

    // Role-specific sections
    Object.entries(roleViews).forEach(([role, view]) => {
      output += OutputFormatter.formatRoleViewForCLI(
        role,
        view.primary,
        view.supporting,
        view.context,
        view.totalFiles
      );
      output += "\n";
    });

    return output;
  }

  /**
   * Format issues and warnings
   */
  static formatIssuesReport(issues: {
    suspicious: SuspiciousFlag[];
    lowConfidence: { file: string; confidence: number }[];
    tied: { file: string; roles: string[] }[];
  }): string {
    let output = "";

    if (issues.suspicious.length === 0 && issues.lowConfidence.length === 0 && issues.tied.length === 0) {
      return "✅ No significant issues detected.\n";
    }

    output += `${"═".repeat(70)}\n`;
    output += `  POTENTIAL ISSUES\n`;
    output += `${"═".repeat(70)}\n\n`;

    // Suspicious classifications
    if (issues.suspicious.length > 0) {
      output += `⚠️  Suspicious Classifications (${issues.suspicious.length}):\n`;
      issues.suspicious.slice(0, 5).forEach((flag) => {
        output += `   • ${flag.file} - ${flag.reason}\n`;
      });
      output += "\n";
    }

    // Low confidence
    if (issues.lowConfidence.length > 0) {
      output += `❓ Low Confidence (${issues.lowConfidence.length}):\n`;
      issues.lowConfidence.slice(0, 5).forEach(({ file, confidence }) => {
        output += `   • ${file} (${(confidence * 100).toFixed(0)}%)\n`;
      });
      output += "\n";
    }

    // Tied classifications
    if (issues.tied.length > 0) {
      output += `🔀 Ambiguous Classifications (${issues.tied.length}):\n`;
      issues.tied.slice(0, 5).forEach(({ file, roles }) => {
        output += `   • ${file} - could be: ${roles.join(", ")}\n`;
      });
      output += "\n";
    }

    output += `${"═".repeat(70)}\n`;
    return output;
  }

  /**
   * Format statistics
   */
  static formatStatistics(stats: {
    totalFiles: number;
    roleDistribution: Record<string, number>;
    confidenceStats: {
      avg: number;
      median: number;
      min: number;
      max: number;
    };
  }): string {
    let output = "";

    output += `${"═".repeat(70)}\n`;
    output += `  STATISTICS\n`;
    output += `${"═".repeat(70)}\n\n`;

    output += `📁 Total Files Analyzed: ${stats.totalFiles}\n\n`;

    output += `📊 Files per Role:\n`;
    Object.entries(stats.roleDistribution)
      .sort(([, a], [, b]) => b - a)
      .forEach(([role, count]) => {
        const pct = ((count / stats.totalFiles) * 100).toFixed(1);
        output += `   ${role.padEnd(12)}: ${count.toString().padStart(3)} (${pct}%)\n`;
      });

    output += `\n📈 Confidence Distribution:\n`;
    output += `   Average:  ${(stats.confidenceStats.avg * 100).toFixed(1)}%\n`;
    output += `   Median:   ${(stats.confidenceStats.median * 100).toFixed(1)}%\n`;
    output += `   Range:    ${(stats.confidenceStats.min * 100).toFixed(1)}% - ${(stats.confidenceStats.max * 100).toFixed(1)}%\n`;

    output += `\n${"═".repeat(70)}\n`;
    return output;
  }

  /**
   * Format a comprehensive repository report
   */
  static formatComprehensiveReport(output: RepositoryOutput): string {
    let result = "";

    // Summary
    result += `\n${"=".repeat(70)}\n`;
    result += `  REPOSITORY ANALYSIS REPORT\n`;
    result += `${"=".repeat(70)}\n\n`;
    result += `${output.summary}\n\n`;

    // All role views
    result += OutputFormatter.formatAllRoleViewsCLI(output.byRole);

    // Issues
    result += OutputFormatter.formatIssuesReport(output.issues);

    // Statistics
    result += OutputFormatter.formatStatistics(output.statistics);

    return result;
  }
}
