/**
 * Confidence Validator.
 * 
 * Computes honest health metrics based on real confidence levels,
 * not just test pass rates.
 */

export interface HealthReport {
  mockTestAccuracy: number; // Part 1: Custom tests (0-1)
  realWorldConfidence: number; // Part 2: Avg confidence on real files (0-1)
  suspiciousFlags: number; // Part 3: Number of flagged issues
  overallHealth: number; // 0-1 weighted score
  healthLabel:
    | "EXCELLENT"
    | "GOOD"
    | "WARNING"
    | "CRITICAL"
    | "UNKNOWN";
  recommendedActions: string[];
  details: {
    filesAnalyzed: number;
    filesWithLowConfidence: number; // < 0.40
    filesWithMediumConfidence: number; // 0.40-0.70
    filesWithHighConfidence: number; // > 0.70
    avgConfidence: number;
    medianConfidence: number;
    minConfidence: number;
    maxConfidence: number;
  };
}

export class ConfidenceValidator {
  /**
   * Compute honest health report based on real data.
   */
  static computeHealth(options: {
    mockTestAccuracy?: number; // 0-1, e.g., 8/8 = 1.0
    fileConfidences: number[]; // Array of confidence scores from Part 2
    suspiciousFlags?: number; // Number of flagged issues from Part 3
  }): HealthReport {
    const {
      mockTestAccuracy = 0.75,
      fileConfidences = [],
      suspiciousFlags = 0,
    } = options;

    // Calculate real-world confidence metrics
    const filesAnalyzed = fileConfidences.length;
    const sortedConfidences = [...fileConfidences].sort((a, b) => a - b);

    const lowConfidence = fileConfidences.filter((c) => c < 0.4).length;
    const mediumConfidence = fileConfidences.filter((c) => c >= 0.4 && c <= 0.7)
      .length;
    const highConfidence = fileConfidences.filter((c) => c > 0.7).length;

    const avgConfidence =
      fileConfidences.length > 0
        ? fileConfidences.reduce((a, b) => a + b, 0) / fileConfidences.length
        : 0;

    const medianConfidence =
      fileConfidences.length > 0
        ? sortedConfidences[Math.floor(fileConfidences.length / 2)]
        : 0;

    const minConfidence = fileConfidences.length > 0 ? sortedConfidences[0] : 0;
    const maxConfidence =
      fileConfidences.length > 0
        ? sortedConfidences[fileConfidences.length - 1]
        : 0;

    // HONEST HEALTH CALCULATION
    // Weight: 40% real confidence, 30% mock tests, 30% lack of suspicious flags
    const confidenceScore = avgConfidence; // 0-1
    const testScore = mockTestAccuracy; // 0-1
    const suspiciousScore = Math.max(0, 1 - suspiciousFlags * 0.1); // -0.1 per flag

    const overallHealth =
      confidenceScore * 0.4 + testScore * 0.3 + suspiciousScore * 0.3;

    // Determine health label
    let healthLabel: HealthReport["healthLabel"] = "UNKNOWN";
    let recommendedActions: string[] = [];

    if (overallHealth >= 0.85) {
      healthLabel = "EXCELLENT";
    } else if (overallHealth >= 0.7) {
      healthLabel = "GOOD";
    } else if (overallHealth >= 0.5) {
      healthLabel = "WARNING";
      recommendedActions.push(
        "Improve file classification accuracy. Many files have low confidence."
      );
    } else {
      healthLabel = "CRITICAL";
      recommendedActions.push(
        "System is unreliable. Model confidence is too low for production use."
      );
    }

    // Add specific recommendations
    if (avgConfidence < 0.5) {
      recommendedActions.push(
        `Real-world confidence is only ${(avgConfidence * 100).toFixed(1)}%. Consider adding more training data or refining patterns.`
      );
    }

    if (lowConfidence > filesAnalyzed * 0.3) {
      recommendedActions.push(
        `${lowConfidence}/${filesAnalyzed} files have very low confidence (<40%). Review classification rules.`
      );
    }

    if (suspiciousFlags > 0) {
      recommendedActions.push(
        `${suspiciousFlags} suspicious classifications detected. Review flagged files manually.`
      );
    }

    if (mockTestAccuracy === 1.0 && avgConfidence < 0.6) {
      recommendedActions.push(
        "⚠️  DOGFOODING GAP: Perfect mock tests but poor real-world confidence. Mock tests may be too easy."
      );
    }

    return {
      mockTestAccuracy,
      realWorldConfidence: avgConfidence,
      suspiciousFlags,
      overallHealth: Math.max(0, Math.min(1, overallHealth)),
      healthLabel,
      recommendedActions,
      details: {
        filesAnalyzed,
        filesWithLowConfidence: lowConfidence,
        filesWithMediumConfidence: mediumConfidence,
        filesWithHighConfidence: highConfidence,
        avgConfidence,
        medianConfidence,
        minConfidence,
        maxConfidence,
      },
    };
  }

  /**
   * Format health report as a readable string.
   */
  static formatReport(report: HealthReport): string {
    const healthPercent = (report.overallHealth * 100).toFixed(1);
    const avgConfidentPercent = (report.realWorldConfidence * 100).toFixed(1);

    const healthBar = this.buildHealthBar(report.overallHealth);

    let output = `
═══════════════════════════════════════════════════════════════════
SYSTEM HEALTH REPORT
═══════════════════════════════════════════════════════════════════

Health Score: ${healthBar} ${healthPercent}%
Status: ${this.getStatusEmoji(report.healthLabel)} ${report.healthLabel}

Real-World Metrics (Part 2):
  Files Analyzed: ${report.details.filesAnalyzed}
  Average Confidence: ${avgConfidentPercent}%
  Low Confidence (<40%): ${report.details.filesWithLowConfidence} files
  Medium Confidence (40-70%): ${report.details.filesWithMediumConfidence} files
  High Confidence (>70%): ${report.details.filesWithHighConfidence} files

Mock Test Performance (Part 1):
  Custom Test Accuracy: ${(report.mockTestAccuracy * 100).toFixed(1)}%

Issues Found (Part 3):
  Suspicious Classifications: ${report.suspiciousFlags}

Breakdown:
  • Low Confidence: ${(report.details.avgConfidence * 100).toFixed(1)}%
  • Median: ${(report.details.medianConfidence * 100).toFixed(1)}%
  • Range: ${(report.details.minConfidence * 100).toFixed(1)}% - ${(report.details.maxConfidence * 100).toFixed(1)}%
`;

    if (report.recommendedActions.length > 0) {
      output += `
⚠️  RECOMMENDED ACTIONS:
${report.recommendedActions.map((action, i) => `  ${i + 1}. ${action}`).join("\n")}
`;
    }

    output += `
═══════════════════════════════════════════════════════════════════
`;

    return output;
  }

  /**
   * Build a visual health bar.
   */
  static buildHealthBar(score: number): string {
    const filled = Math.round(score * 20);
    const empty = 20 - filled;

    // Color coding
    let bar = "█".repeat(filled) + "░".repeat(empty);

    if (score >= 0.85) {
      return `✅ ${bar}`;
    } else if (score >= 0.7) {
      return `⚠️  ${bar}`;
    } else if (score >= 0.5) {
      return `⚠️  ${bar}`;
    } else {
      return `❌ ${bar}`;
    }
  }

  /**
   * Get emoji for status.
   */
  static getStatusEmoji(status: HealthReport["healthLabel"]): string {
    switch (status) {
      case "EXCELLENT":
        return "✅";
      case "GOOD":
        return "✅";
      case "WARNING":
        return "⚠️";
      case "CRITICAL":
        return "❌";
      default:
        return "❓";
    }
  }
}
