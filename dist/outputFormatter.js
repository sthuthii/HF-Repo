"use strict";
/**
 * Production Output Formatter.
 *
 * Transforms raw analysis into clean, user-facing output.
 * Groups files by priority/role, cleans dependencies, and limits results.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputFormatter = void 0;
const dependencyParser_1 = require("./dependencyParser");
class OutputFormatter {
    /**
     * Format a single file for display.
     */
    static formatFile(result, priority = "supporting", dependencies = [], suspiciousFlag) {
        const cleanDeps = dependencies
            .slice(0, 5)
            .map((dep) => dependencyParser_1.DependencyParser.cleanDependency(dep))
            .filter((dep) => dep !== "")
            // THE GARBAGE FILTER: Drop anything with parentheses, spaces, or periods
            .filter((dep) => !/[\(\)\. ]/.test(dep));
        return {
            path: result.file,
            role: result.primaryRole,
            confidence: result.confidence,
            priority,
            dependencies: cleanDeps,
            dependenciesDisplay: dependencyParser_1.DependencyParser.formatForDisplay(cleanDeps, 3),
            confidence_pct: `${(result.confidence * 100).toFixed(1)}%`,
            suspicious: suspiciousFlag,
        };
    }
    /**
     * Group files by role and priority.
     */
    static groupByRole(files) {
        const grouped = {};
        // Initialize all roles
        for (const role of Object.values(Object.values)) {
            // This is a bit hacky but works
            grouped[role] = { files: new Map(), total: 0 };
        }
        // Group files
        for (const { result, priority, dependencies, suspicious } of files) {
            const role = result.primaryRole;
            if (!grouped[role]) {
                grouped[role] = {
                    files: new Map(),
                    total: 0,
                };
            }
            if (!grouped[role].files.has(priority)) {
                grouped[role].files.set(priority, []);
            }
            const formatted = this.formatFile(result, priority, dependencies, suspicious);
            grouped[role].files.get(priority).push(formatted);
            grouped[role].total++;
        }
        // Convert to view format
        const views = {};
        for (const [role, group] of Object.entries(grouped)) {
            if (group.total === 0)
                continue; // Skip empty roles
            const primary = group.files.get("primary") || [];
            const supporting = group.files.get("supporting") || [];
            const context = group.files.get("context") || [];
            views[role] = {
                role,
                totalFiles: group.total,
                filesInRole: group.total,
                primary: primary.sort((a, b) => b.confidence - a.confidence),
                supporting: supporting.sort((a, b) => b.confidence - a.confidence),
                context: context.sort((a, b) => b.confidence - a.confidence),
                summary: `${primary.length} primary, ${supporting.length} supporting, ${context.length} context`,
            };
        }
        return views;
    }
    /**
     * Format a role view for CLI display.
     */
    static formatRoleViewCLI(view, limit = 10) {
        let output = `\n📁 ${view.role.toUpperCase()} ROLE\n`;
        output += `${"=".repeat(60)}\n`;
        output += `Files: ${view.filesInRole} (${view.summary})\n\n`;
        // Primary files
        if (view.primary.length > 0) {
            output += `🎯 PRIMARY (Core files - ${view.primary.length})\n`;
            output += `${"-".repeat(60)}\n`;
            for (const file of view.primary.slice(0, limit / 3)) {
                output += this.formatFileLine(file);
            }
            if (view.primary.length > limit / 3) {
                output += `  ... and ${view.primary.length - Math.floor(limit / 3)} more\n`;
            }
            output += "\n";
        }
        // Supporting files
        if (view.supporting.length > 0) {
            output += `📄 SUPPORTING (Helper files - ${view.supporting.length})\n`;
            output += `${"-".repeat(60)}\n`;
            for (const file of view.supporting.slice(0, limit / 3)) {
                output += this.formatFileLine(file);
            }
            if (view.supporting.length > limit / 3) {
                output += `  ... and ${view.supporting.length - Math.floor(limit / 3)} more\n`;
            }
            output += "\n";
        }
        // Context files
        if (view.context.length > 0) {
            output += `📋 CONTEXT (Reference files - ${view.context.length})\n`;
            output += `${"-".repeat(60)}\n`;
            for (const file of view.context.slice(0, limit / 3)) {
                output += this.formatFileLine(file);
            }
            if (view.context.length > limit / 3) {
                output += `  ... and ${view.context.length - Math.floor(limit / 3)} more\n`;
            }
        }
        return output;
    }
    /**
     * Format a single file line.
     */
    static formatFileLine(file) {
        let line = `  📄 ${file.path}\n`;
        line += `     Confidence: ${file.confidence_pct}`;
        if (file.dependenciesDisplay !== "none") {
            line += ` | Deps: ${file.dependenciesDisplay}`;
        }
        if (file.suspicious) {
            line += ` ⚠️  [${file.suspicious.reason}]`;
        }
        line += "\n";
        return line;
    }
    /**
     * Format suspicious findings.
     */
    static formatSuspiciousCLI(flags) {
        if (flags.length === 0) {
            return "\n✅ No suspicious classifications detected.\n";
        }
        let output = `\n⚠️  SUSPICIOUS CLASSIFICATIONS (${flags.length} issues)\n`;
        output += `${"=".repeat(60)}\n\n`;
        // Group by severity
        const critical = flags.filter((f) => f.severity === "critical");
        const warnings = flags.filter((f) => f.severity === "warning");
        if (critical.length > 0) {
            output += `🔴 CRITICAL (${critical.length})\n`;
            output += `${"-".repeat(60)}\n`;
            for (const flag of critical.slice(0, 5)) {
                output += `  ${flag.file}\n`;
                output += `    Current: ${flag.role} (${(flag.confidence * 100).toFixed(1)}%)\n`;
                output += `    Issue: ${flag.reason}\n`;
                if (flag.suggestion) {
                    output += `    Suggestion: ${flag.suggestion}\n`;
                }
                output += "\n";
            }
            if (critical.length > 5) {
                output += `  ... and ${critical.length - 5} more critical issues\n\n`;
            }
        }
        if (warnings.length > 0) {
            output += `🟡 WARNINGS (${warnings.length})\n`;
            output += `${"-".repeat(60)}\n`;
            for (const flag of warnings.slice(0, 5)) {
                output += `  ${flag.file}\n`;
                output += `    Current: ${flag.role} (${(flag.confidence * 100).toFixed(1)}%)\n`;
                output += `    Issue: ${flag.reason}\n`;
                if (flag.suggestion) {
                    output += `    Suggestion: ${flag.suggestion}\n`;
                }
                output += "\n";
            }
            if (warnings.length > 5) {
                output += `  ... and ${warnings.length - 5} more warnings\n\n`;
            }
        }
        return output;
    }
    /**
     * Format statistics.
     */
    static formatStatisticsCLI(stats) {
        const confAvg = (stats.confidenceStats.avg * 100).toFixed(1);
        const confMedian = (stats.confidenceStats.median * 100).toFixed(1);
        const confMin = (stats.confidenceStats.min * 100).toFixed(1);
        const confMax = (stats.confidenceStats.max * 100).toFixed(1);
        let output = `\n📊 STATISTICS\n`;
        output += `${"=".repeat(60)}\n`;
        output += `Total Files: ${stats.totalFiles}\n\n`;
        output += `Role Distribution:\n`;
        const sorted = Object.entries(stats.roleDistribution).sort(([, a], [, b]) => b - a);
        for (const [role, count] of sorted) {
            const pct = ((count / stats.totalFiles) * 100).toFixed(1);
            const bar = "█".repeat(Math.round((count / stats.totalFiles) * 20));
            output += `  ${role.padEnd(12)} ${bar.padEnd(20)} ${count} (${pct}%)\n`;
        }
        output += `\nConfidence Levels:\n`;
        output += `  Average:  ${confAvg}%\n`;
        output += `  Median:   ${confMedian}%\n`;
        output += `  Range:    ${confMin}% - ${confMax}%\n`;
        return output;
    }
    /**
     * Format complete repository output.
     */
    static formatRepositoryCLI(repo) {
        let output = `\n`;
        output += `╔${"═".repeat(58)}╗\n`;
        output += `║  REPOSITORY ANALYSIS REPORT                            ║\n`;
        output += `╚${"═".repeat(58)}╝\n`;
        // Summary
        output += repo.summary;
        // Role views (limit to 3 top roles by file count)
        const topRoles = Object.entries(repo.byRole)
            .sort(([, a], [, b]) => b.filesInRole - a.filesInRole)
            .slice(0, 3);
        for (const [, view] of topRoles) {
            output += this.formatRoleViewCLI(view);
        }
        // Issues
        output += this.formatSuspiciousCLI(repo.issues.suspicious);
        // Statistics
        output += this.formatStatisticsCLI(repo.statistics);
        return output;
    }
}
exports.OutputFormatter = OutputFormatter;
//# sourceMappingURL=outputFormatter.js.map