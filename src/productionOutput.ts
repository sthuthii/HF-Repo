/**
 * Production Output Integration Example.
 * 
 * Demonstrates how to use the new output layer on top of existing analysis.
 * No changes to core logic - this is purely a presentation layer.
 */

import { FileClassificationResult } from "./types";
import { DependencyParser } from "./dependencyParser";
import { SuspiciousClassifier } from "./suspiciousClassifier";
import { TieBreaker } from "./tieBreaker";
import { ConfidenceValidator } from "./confidenceValidator";
import { OutputFormatter } from "./outputFormatter";
import { RepositoryAnalyzer } from "./repoAnalyzer";
import { RepositorySummaryGenerator } from "./repositorySummary";

/**
 * Production output builder.
 * Takes raw analysis and transforms it into user-friendly output.
 */
export class ProductionOutput {
  /**
   * Transform raw file classifications into formatted output.
   * 
   * Input:
   * - classificationResults: Array of FileClassificationResult from FileClassifier
   * - fileContents: Map of file paths to content (for dependency extraction)
   * - rawDependencies: Map of file paths to dependency strings
   * - dependents: Optional map of file paths to their dependents
   * 
   * Output:
   * - Formatted, validated, and highlighted output ready for display
   */
  static transform(options: {
    classificationResults: FileClassificationResult[];
    fileContents?: Record<string, string>;
    rawDependencies?: Record<string, string>;
    dependents?: Record<string, string[]>;
    mockTestAccuracy?: number; // e.g., 1.0 for 8/8
  }): {
    formattedOutput: string;
    healthReport: string;
    issuesReport: string;
    repositorySummary: string;
  } {
    const {
      classificationResults,
      fileContents = {},
      rawDependencies = {},
      dependents = {},
      mockTestAccuracy = 0.75,
    } = options;

    // STEP 1: Apply tie-breaking for ambiguous classifications
    console.log("🔧 Step 1: Detecting and breaking ties...");
    const tieResolvedResults = classificationResults.map((result) => {
      const tieStatus = TieBreaker.detectTie(result.scores);

      if (tieStatus.isTie) {
        const resolution = TieBreaker.breakTie(
          result.file,
          tieStatus.tiedRoles,
          result.scores
        );
        return {
          ...result,
          primaryRole: resolution.role,
          confidence: result.scores[resolution.role],
          tieBreakingReason: resolution.reason,
          wasTied: true,
          tiedWith: resolution.tiedRoles,
        };
      }

      return { ...result, wasTied: false };
    });

    // STEP 2: Clean dependencies
    console.log("🧹 Step 2: Cleaning dependency extraction...");
    const cleanedDeps: Record<string, string[]> = {};

    for (const [file, rawDep] of Object.entries(rawDependencies)) {
      cleanedDeps[file] = DependencyParser.parseDependencyList(rawDep);
    }

    // STEP 3: Flag suspicious classifications
    console.log("🚨 Step 3: Detecting suspicious classifications...");
    const suspiciousFlags = SuspiciousClassifier.flagMultiple(
      tieResolvedResults.map((result) => ({
        file: result.file,
        role: result.primaryRole,
        confidence: result.confidence,
        topScores: result.scores,
      }))
    );

    const suspicionSummary = SuspiciousClassifier.summarize(suspiciousFlags);
    console.log(
      `   Found ${suspicionSummary.total} issues (${suspicionSummary.critical} critical, ${suspicionSummary.warnings} warnings)`
    );

    // STEP 4: Calculate health metrics
    console.log("📊 Step 4: Computing health metrics...");
    const confidences = tieResolvedResults.map((r) => r.confidence);
    const healthReport = ConfidenceValidator.computeHealth({
      mockTestAccuracy,
      fileConfidences: confidences,
      suspiciousFlags: suspiciousFlags.length,
    });

    // STEP 5: Format output
    console.log("✨ Step 5: Formatting output...");

    // Build file groupings
    const fileGroups = tieResolvedResults.map((result, idx) => ({
      result,
      priority: this.determinePriority(result, idx),
      dependencies: cleanedDeps[result.file] || [],
      suspicious: suspiciousFlags.find((f) => f.file === result.file),
    }));

    // Group by role
    const byRole = OutputFormatter.groupByRole(fileGroups);

    // Build repository output
    const repoOutput = {
      summary: this.buildSummary(
        tieResolvedResults,
        suspiciousFlags,
        healthReport
      ),
      byRole,
      issues: {
        suspicious: suspiciousFlags,
        lowConfidence: tieResolvedResults
          .filter((r) => r.confidence < 0.4)
          .map((r) => ({ file: r.file, confidence: r.confidence }))
          .sort((a, b) => a.confidence - b.confidence),
        tied: tieResolvedResults
          .filter((r) => (r as any).wasTied)
          .map((r) => ({ file: r.file, roles: (r as any).tiedWith || [] })),
      },
      statistics: {
        totalFiles: tieResolvedResults.length,
        roleDistribution: this.buildRoleDistribution(tieResolvedResults),
        confidenceStats: {
          avg:
            confidences.reduce((a, b) => a + b, 0) / confidences.length,
          median: confidences.sort((a, b) => a - b)[
            Math.floor(confidences.length / 2)
          ],
          min: Math.min(...confidences),
          max: Math.max(...confidences),
        },
      },
    };

    // Format for display
    const formattedOutput = OutputFormatter.formatRepositoryCLI(repoOutput);
    const healthReportStr = ConfidenceValidator.formatReport(healthReport);
    const issuesReportStr = this.buildIssuesReport(
      suspiciousFlags,
      repoOutput.issues.lowConfidence,
      repoOutput.issues.tied
    );

    // Generate repository summary
    console.log("📊 Step 6: Generating repository summary...");

    const repoAnalysis = RepositoryAnalyzer.analyze({
      classifications: tieResolvedResults,
      dependencies: cleanedDeps,
      dependents,
    });

    const repositorySummary = RepositorySummaryGenerator.generate({
      classifications: tieResolvedResults,
      dependencies: cleanedDeps,
      dependents,
      analysis: repoAnalysis,
    });

    const repositorySummaryStr = RepositorySummaryGenerator.formatForCLI(repositorySummary);

    return {
      formattedOutput,
      healthReport: healthReportStr,
      issuesReport: issuesReportStr,
      repositorySummary: repositorySummaryStr,
    };
  }

  /**
   * Determine priority based on confidence and role.
   */
  private static determinePriority(
    result: any,
    index: number
  ): "primary" | "supporting" | "context" {
    if (result.confidence >= 0.7) {
      return "primary";
    } else if (result.confidence >= 0.4) {
      return "supporting";
    } else {
      return "context";
    }
  }

  /**
   * Build role distribution map.
   */
  private static buildRoleDistribution(
    results: any[]
  ): Record<string, number> {
    const dist: Record<string, number> = {};

    for (const result of results) {
      dist[result.primaryRole] = (dist[result.primaryRole] || 0) + 1;
    }

    return dist;
  }

  /**
   * Build summary text.
   */
  private static buildSummary(
    results: any[],
    flags: any[],
    health: any
  ): string {
    let summary = `\n📋 SUMMARY\n`;
    summary += `${"=".repeat(60)}\n`;
    summary += `Files Analyzed: ${results.length}\n`;
    summary += `Health Status: ${health.healthLabel} (${(health.overallHealth * 100).toFixed(1)}%)\n`;
    summary += `Avg Confidence: ${(health.realWorldConfidence * 100).toFixed(1)}%\n`;
    summary += `Issues Found: ${flags.length}\n`;
    summary += `\n`;

    return summary;
  }

  /**
   * Build issues report.
   */
  private static buildIssuesReport(
    suspicious: any[],
    lowConf: any[],
    tied: any[]
  ): string {
    let report = `\n⚠️  ISSUES REPORT\n`;
    report += `${"=".repeat(60)}\n`;

    if (suspicious.length === 0 && lowConf.length === 0 && tied.length === 0) {
      report += `✅ No major issues detected.\n`;
      return report;
    }

    if (suspicious.length > 0) {
      report += `\nSuspicious Classifications: ${suspicious.length}\n`;
      for (const flag of suspicious.slice(0, 3)) {
        report += `  • ${flag.file}: ${flag.reason}\n`;
      }
      if (suspicious.length > 3) {
        report += `  ... and ${suspicious.length - 3} more\n`;
      }
    }

    if (lowConf.length > 0) {
      report += `\nLow Confidence (<40%): ${lowConf.length}\n`;
      for (const item of lowConf.slice(0, 3)) {
        report += `  • ${item.file}: ${(item.confidence * 100).toFixed(1)}%\n`;
      }
      if (lowConf.length > 3) {
        report += `  ... and ${lowConf.length - 3} more\n`;
      }
    }

    if (tied.length > 0) {
      report += `\nAmbiguous Classifications (Tied): ${tied.length}\n`;
      for (const item of tied.slice(0, 3)) {
        report += `  • ${item.file}: ${item.roles.join(" = ")}\n`;
      }
      if (tied.length > 3) {
        report += `  ... and ${tied.length - 3} more\n`;
      }
    }

    return report;
  }
}

/**
 * Simple CLI example.
 */
export async function demonstrateProductionOutput() {
  console.log("\n=== PRODUCTION OUTPUT LAYER DEMONSTRATION ===\n");

  // Mock data for demonstration
  const mockResults: FileClassificationResult[] = [
    {
      file: "src/roleClassifier.ts",
      fileType: ".ts",
      scores: {
        frontend: 0.13,
        backend: 0.13,
        qa: 0.49,
        devops: 0.0,
        ai_ml: 0.0,
        data: 0.0,
        security: 0.0,
        full_stack: 0.25,
      },
      primaryRole: "qa",
      confidence: 0.49,
    },
    {
      file: "package-lock.json",
      fileType: ".json",
      scores: {
        frontend: 0.0,
        backend: 0.0,
        qa: 0.0,
        devops: 0.0,
        ai_ml: 0.0,
        data: 0.0,
        security: 0.556,
        full_stack: 0.444,
      },
      primaryRole: "security",
      confidence: 0.556,
    },
    {
      file: "debug_counts.py",
      fileType: ".py",
      scores: {
        frontend: 0.0,
        backend: 0.313,
        qa: 0.0,
        devops: 0.0,
        ai_ml: 0.313,
        data: 0.313,
        security: 0.0,
        full_stack: 0.06,
      },
      primaryRole: "backend",
      confidence: 0.313,
    },
  ];

  const mockDeps: Record<string, string> = {
    "src/roleClassifier.ts": "./config, {, \"./config\";",
    "package-lock.json":
      'integrity, "sha512", {, dependencies;',
    "debug_counts.py":
      "os, sys, \"./utils\", pathlib",
  };

  // Transform to production output
  const output = ProductionOutput.transform({
    classificationResults: mockResults,
    rawDependencies: mockDeps,
    mockTestAccuracy: 0.75,
  });

  console.log(output.formattedOutput);
  console.log(output.healthReport);
  console.log(output.issuesReport);
}
