/**
 * CLI Renderer for Enhanced Role Views
 *
 * Renders enhanced role views with:
 * - Clear visual hierarchy
 * - Cross-role context
 * - Learning guidance
 * - Critical information highlighted
 * - Information properly limited (no overload)
 */

import { EnhancedRoleView } from "./roleViewsEnhanced";
import { PrioritizedFile } from "./types";

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

export class RoleViewCLIRenderer {
  /**
   * Render enhanced role view for CLI
   */
  static render(view: EnhancedRoleView): string {
    let output = "";

    // Header
    output += this.renderHeader(view);

    // Quick summary
    output += this.renderSummary(view);

    // Warnings if any
    if (view.warnings && view.warnings.length > 0) {
      output += this.renderWarnings(view.warnings);
    }

    // Cross-role context
    output += this.renderCrossRoleContext(view);

    // Primary files
    output += this.renderPrimaryFiles(view);

    // Supporting files
    output += this.renderSupportingFiles(view);

    // Must-know section
    output += this.renderMustKnow(view);

    // Footer
    output += this.renderFooter(view);

    return output;
  }

  /**
   * Render header with title and description
   */
  private static renderHeader(view: EnhancedRoleView): string {
    let output = "";

    output += `\n${"═".repeat(75)}\n`;
    output += `${COLORS.bold}${COLORS.cyan}${view.title}${COLORS.reset}\n`;
    output += `${"═".repeat(75)}\n\n`;
    output += `${view.description}\n\n`;

    return output;
  }

  /**
   * Render quick summary
   */
  private static renderSummary(view: EnhancedRoleView): string {
    const primary = view.primary?.length || 0;
    const supporting = view.supporting?.length || 0;
    const context = view.context?.length || 0;
    const total = primary + supporting + context;

    let output = "";
    output += `${COLORS.dim}📊 Files: ${COLORS.reset}`;
    output += `${COLORS.green}${primary} primary${COLORS.reset} • `;
    output += `${COLORS.yellow}${supporting} supporting${COLORS.reset} • `;
    output += `${COLORS.dim}${context} context${COLORS.reset}`;
    output += ` (${total} total)\n\n`;

    return output;
  }

  /**
   * Render warnings
   */
  private static renderWarnings(warnings: string[]): string {
    let output = "";
    output += `${"─".repeat(75)}\n`;
    output += `${COLORS.red}⚠️  WARNINGS${COLORS.reset}\n`;
    output += `${"─".repeat(75)}\n`;

    warnings.forEach((warning) => {
      output += `${COLORS.red}  • ${warning}${COLORS.reset}\n`;
    });

    output += "\n";
    return output;
  }

  /**
   * Render cross-role context
   */
  private static renderCrossRoleContext(view: EnhancedRoleView): string {
    const context = view.crossRoleContext;
    let output = "";

    if (context.dependsOn.length === 0 && context.providesTo.length === 0) {
      return "";
    }

    output += `${"─".repeat(75)}\n`;
    output += `${COLORS.bold}🔗 CROSS-ROLE CONNECTIONS${COLORS.reset}\n`;
    output += `${"─".repeat(75)}\n`;

    if (context.dependsOn.length > 0) {
      output += `\n${COLORS.bold}Depends on:${COLORS.reset}\n`;
      context.dependsOn.forEach((dep) => {
        output += `  • ${COLORS.cyan}${dep.role}${COLORS.reset}: ${dep.reason}\n`;
        if (dep.keyInterfaces && dep.keyInterfaces.length > 0) {
          output += `    Interfaces: ${dep.keyInterfaces.join(", ")}\n`;
        }
      });
    }

    if (context.providesTo.length > 0) {
      output += `\n${COLORS.bold}Provides to:${COLORS.reset}\n`;
      context.providesTo.forEach((dep) => {
        output += `  • ${COLORS.cyan}${dep.role}${COLORS.reset}: ${dep.reason}\n`;
        if (dep.keyInterfaces && dep.keyInterfaces.length > 0) {
          output += `    Interfaces: ${dep.keyInterfaces.join(", ")}\n`;
        }
      });
    }

    output += "\n";
    return output;
  }

  /**
   * Render primary files (critical)
   */
  private static renderPrimaryFiles(view: EnhancedRoleView): string {
    if (!view.primary || view.primary.length === 0) {
      return "";
    }

    let output = "";
    output += `${"─".repeat(75)}\n`;
    output += `${COLORS.bold}${COLORS.green}✅ PRIMARY (Must understand - ${view.primary.length} files)${COLORS.reset}\n`;
    output += `${"─".repeat(75)}\n`;

    view.primary.slice(0, 5).forEach((file, idx) => {
      output += `\n  ${COLORS.bold}${idx + 1}. ${file.filePath || file.path}${COLORS.reset}\n`;
      output += `     Confidence: ${COLORS.green}${(file.score * 100).toFixed(0)}%${COLORS.reset}\n`;
      if (file.explanation) {
        output += `     Why: ${file.explanation}\n`;
      }
    });

    output += "\n";
    return output;
  }

  /**
   * Render supporting files
   */
  private static renderSupportingFiles(view: EnhancedRoleView): string {
    if (!view.supporting || view.supporting.length === 0) {
      return "";
    }

    let output = "";
    output += `${"─".repeat(75)}\n`;
    output += `${COLORS.bold}${COLORS.yellow}🔧 SUPPORTING (Related logic - ${view.supporting.length} files)${COLORS.reset}\n`;
    output += `${"─".repeat(75)}\n`;

    view.supporting.slice(0, 7).forEach((file) => {
      output += `  • ${file.filePath || file.path}\n`;
      output += `    ${COLORS.dim}${(file.score * 100).toFixed(0)}% - ${file.explanation || "Related dependency"}${COLORS.reset}\n`;
    });

    output += "\n";
    return output;
  }

  /**
   * Render must-know section
   */
  private static renderMustKnow(view: EnhancedRoleView): string {
    const mustKnow = view.mustKnow;
    let output = "";

    output += `${"─".repeat(75)}\n`;
    output += `${COLORS.bold}💡 MUST KNOW${COLORS.reset}\n`;
    output += `${"─".repeat(75)}\n`;

    // Entry points
    if (mustKnow.entryPoints.length > 0) {
      output += `\n${COLORS.bold}Entry Points:${COLORS.reset}\n`;
      mustKnow.entryPoints.forEach((ep) => {
        output += `  • ${ep.path}\n`;
        output += `    ${COLORS.dim}${ep.why}${COLORS.reset}\n`;
      });
    }

    // Key patterns
    if (mustKnow.keyPatterns.length > 0) {
      output += `\n${COLORS.bold}Key Patterns to Understand:${COLORS.reset}\n`;
      mustKnow.keyPatterns.forEach((pattern) => {
        output += `  • ${pattern}\n`;
      });
    }

    // Common errors
    if (mustKnow.commonErrors.length > 0) {
      output += `\n${COLORS.bold}${COLORS.red}Common Mistakes to Avoid:${COLORS.reset}\n`;
      mustKnow.commonErrors.slice(0, 3).forEach((error) => {
        output += `  ${COLORS.red}✗${COLORS.reset} ${error}\n`;
      });
    }

    // Quick wins
    if (mustKnow.quickWins.length > 0) {
      output += `\n${COLORS.bold}${COLORS.green}Quick Wins (Good First Tasks):${COLORS.reset}\n`;
      mustKnow.quickWins.forEach((win) => {
        output += `  ${COLORS.green}✓${COLORS.reset} ${win}\n`;
      });
    }

    output += "\n";
    return output;
  }

  /**
   * Render footer with next steps
   */
  private static renderFooter(view: EnhancedRoleView): string {
    let output = "";

    output += `${"─".repeat(75)}\n`;
    output += `${COLORS.dim}Next: Review primary files first, then explore supporting dependencies.${COLORS.reset}\n`;
    output += `${COLORS.dim}Ask your team lead for clarification on architectural patterns.${COLORS.reset}\n`;
    output += `${"═".repeat(75)}\n\n`;

    return output;
  }

  /**
   * Render multiple role views side-by-side summary
   */
  static renderMultiRoleSummary(views: Map<string, EnhancedRoleView>): string {
    let output = "";

    output += `\n${"═".repeat(75)}\n`;
    output += `${COLORS.bold}${COLORS.cyan}REPOSITORY ROLE OVERVIEW${COLORS.reset}\n`;
    output += `${"═".repeat(75)}\n\n`;

    output += `${COLORS.bold}Available Role Perspectives:${COLORS.reset}\n`;

    Array.from(views.entries()).forEach(([role, view]) => {
      const primary = view.primary?.length || 0;
      const supporting = view.supporting?.length || 0;
      output += `  ${COLORS.cyan}${role.padEnd(15)}${COLORS.reset}: `;
      output += `${COLORS.green}${primary} primary${COLORS.reset} + `;
      output += `${COLORS.yellow}${supporting} supporting${COLORS.reset}\n`;
    });

    output += `\n${COLORS.dim}Run 'npm run dev role <role>' to explore a specific role in detail.${COLORS.reset}\n`;
    output += `${"═".repeat(75)}\n\n`;

    return output;
  }
}
