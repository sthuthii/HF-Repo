/**
 * Improved Scoring Module
 *
 * Enhances file classification with:
 * - Deterministic scoring for obvious files (0.0 or 1.0, no random defaults)
 * - Cross-file context (how files relate to each other)
 * - Architecture-aware scoring (MVC patterns, layer detection)
 * - Confidence-based tier system (critical vs. supporting files)
 */

import { Role } from "./config";
import { FileClassificationResult } from "./types";

interface ScoringContext {
  allFiles: string[];
  fileContents: Map<string, string>;
  architecturePatterns: ArchitecturePattern[];
}

interface ArchitecturePattern {
  name: string;
  pattern: RegExp;
  primaryRole: Role;
  confidence: number;
}

/**
 * Improved scoring strategies
 */
export class ImprovedScoringEngine {
  /**
   * Enhance classification scores with deterministic rules
   */
  static enhanceScores(
    classification: FileClassificationResult,
    filePath: string,
    context?: ScoringContext
  ): FileClassificationResult {
    let scores = { ...classification.scores };

    // Apply deterministic rules in order of priority
    scores = this.applyDeterministicRules(scores, filePath);
    scores = this.applyArchitectureContext(scores, filePath, context);
    scores = this.applyFileTierSystem(scores, filePath);

    // Normalize scores after all adjustments
    scores = this.normalizeScores(scores);

    return {
      ...classification,
      scores,
      primaryRole: Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0],
      confidence: Math.max(...Object.values(scores)),
    };
  }

  /**
   * Apply deterministic rules - files have clear roles, not probabilistic
   */
  private static applyDeterministicRules(
    scores: Record<string, number>,
    filePath: string
  ): Record<string, number> {
    const adjusted = { ...scores };
    const fileLower = filePath.toLowerCase();

    // Infrastructure files - ALWAYS DevOps
    const infraFiles = [
      "dockerfile", "docker-compose", "kubernetes.yaml", "helm",
      "terraform.tf", "ansible.yml", "jenkinsfile", "makefile",
      ".gitlab-ci.yml", ".github/workflows"
    ];
    if (infraFiles.some(f => fileLower.includes(f))) {
      adjusted[Role.DEVOPS] = 0.95;
      for (const role of Object.keys(adjusted)) {
        if (role !== Role.DEVOPS) adjusted[role] = 0.0;
      }
      return adjusted;
    }

    // Test files - ALWAYS QA (unless in specific dev folders)
    const testIndicators = [".test.", ".spec.", "__tests__", "/e2e/", "/integration/"];
    if (testIndicators.some(ind => fileLower.includes(ind))) {
      adjusted[Role.QA] = 0.9;
      for (const role of Object.keys(adjusted)) {
        if (role !== Role.QA) adjusted[role] = Math.min(adjusted[role], 0.1);
      }
      return adjusted;
    }

    // SQL files - ALWAYS Data
    if (fileLower.endsWith(".sql")) {
      adjusted[Role.DATA] = 0.9;
      for (const role of Object.keys(adjusted)) {
        if (role !== Role.DATA) adjusted[role] = 0.0;
      }
      return adjusted;
    }

    // Frontend files - ALWAYS Frontend
    const frontendExtensions = [".tsx", ".jsx", ".vue", ".svelte"];
    if (frontendExtensions.some(ext => fileLower.endsWith(ext))) {
      adjusted[Role.FRONTEND] = 0.95;
      adjusted[Role.FULL_STACK] = 0.5;
      for (const role of Object.keys(adjusted)) {
        if (role !== Role.FRONTEND && role !== Role.FULL_STACK) {
          adjusted[role] = 0.0;
        }
      }
      return adjusted;
    }

    // Configuration files - ALWAYS DevOps
    const configFiles = [".env", ".env.example", "config.yml", "config.yaml", "docker-compose.yml"];
    if (configFiles.some(f => fileLower.includes(f))) {
      adjusted[Role.DEVOPS] = 0.8;
      return adjusted;
    }

    // Model/Migration files - Data role
    if (fileLower.includes("migration") || fileLower.includes("schema")) {
      adjusted[Role.DATA] = 0.85;
      return adjusted;
    }

    // Authentication - ALWAYS Security
    if (fileLower.includes("auth") && (fileLower.includes("service") || fileLower.includes("middleware"))) {
      adjusted[Role.SECURITY] = 0.9;
      adjusted[Role.BACKEND] = Math.min(adjusted[Role.BACKEND], 0.3);
      return adjusted;
    }

    return adjusted;
  }

  /**
   * Apply architecture-aware context
   */
  private static applyArchitectureContext(
    scores: Record<string, number>,
    filePath: string,
    context?: ScoringContext
  ): Record<string, number> {
    const adjusted = { ...scores };

    // MVC Architecture Detection
    if (filePath.includes("controller")) {
      adjusted[Role.BACKEND] = Math.max(adjusted[Role.BACKEND], 0.8);
      adjusted[Role.FRONTEND] = Math.max(adjusted[Role.FRONTEND], 0.3); // Full-stack support
    }

    if (filePath.includes("model") || filePath.includes("entity")) {
      adjusted[Role.DATA] = Math.max(adjusted[Role.DATA], 0.7);
      adjusted[Role.BACKEND] = Math.max(adjusted[Role.BACKEND], 0.6);
    }

    // API/Route pattern
    if (filePath.includes("route") || filePath.includes("endpoint")) {
      adjusted[Role.BACKEND] = Math.max(adjusted[Role.BACKEND], 0.85);
      adjusted[Role.FRONTEND] = Math.max(adjusted[Role.FRONTEND], 0.4);
    }

    // Middleware pattern
    if (filePath.includes("middleware")) {
      adjusted[Role.BACKEND] = Math.max(adjusted[Role.BACKEND], 0.75);
      adjusted[Role.SECURITY] = Math.max(adjusted[Role.SECURITY], 0.4);
    }

    // Hook/Composable pattern (frontend)
    if (filePath.includes("hook") || filePath.includes("composable") || filePath.includes("composables")) {
      adjusted[Role.FRONTEND] = Math.max(adjusted[Role.FRONTEND], 0.8);
      adjusted[Role.FULL_STACK] = Math.max(adjusted[Role.FULL_STACK], 0.3);
    }

    // Utilities/Helpers (lower priority across roles)
    if (filePath.includes("util") || filePath.includes("helper")) {
      // Don't boost, but don't penalize - utilities are cross-role
      return adjusted;
    }

    return adjusted;
  }

  /**
   * Apply file tier system (critical vs. supporting)
   *
   * Critical files (100% relevance):
   * - Main entry points
   * - Core business logic
   * - Essential dependencies
   *
   * Supporting files (40-70% relevance):
   * - Utilities, helpers
   * - Configuration
   * - Middleware
   *
   * Context files (< 40% relevance):
   * - Documentation
   * - Examples
   * - Tests
   */
  private static applyFileTierSystem(
    scores: Record<string, number>,
    filePath: string
  ): Record<string, number> {
    const adjusted = { ...scores };
    const fileLower = filePath.toLowerCase();

    // Penalize generic/utility files (they're not critical)
    if (fileLower.includes("util") || fileLower.includes("helper") || fileLower.includes("lib")) {
      for (const role of Object.keys(adjusted)) {
        adjusted[role] = Math.max(adjusted[role] * 0.7, 0.1); // Lower relevance
      }
      return adjusted;
    }

    // Boost entry point files
    if (fileLower.includes("index") || fileLower.includes("main") || fileLower.includes("app")) {
      for (const role of Object.keys(adjusted)) {
        if (adjusted[role] > 0.3) {
          adjusted[role] = Math.min(adjusted[role] * 1.2, 1.0); // Boost relevant roles
        }
      }
    }

    // Configuration is always supporting, not primary
    if (fileLower.includes("config")) {
      for (const role of Object.keys(adjusted)) {
        adjusted[role] = Math.min(adjusted[role], 0.6); // Cap at supporting level
      }
    }

    return adjusted;
  }

  /**
   * Normalize scores to ensure they're in proper range and sum appropriately
   */
  private static normalizeScores(scores: Record<string, number>): Record<string, number> {
    const normalized: Record<string, number> = {};
    const max = Math.max(...Object.values(scores));

    if (max === 0) {
      // All zero - distribute evenly as context
      for (const role of Object.keys(scores)) {
        normalized[role] = 0.2;
      }
    } else {
      for (const [role, score] of Object.entries(scores)) {
        normalized[role] = Math.max(0, Math.min(1, score / max * 0.95));
      }
    }

    return normalized;
  }

  /**
   * Compute confidence score (0-1) based on scoring certainty
   */
  static computeConfidence(scores: Record<string, number>): number {
    const sortedScores = Object.values(scores)
      .sort((a, b) => b - a)
      .slice(0, 2);

    if (sortedScores.length < 2) {
      return sortedScores[0] || 0;
    }

    const [top, second] = sortedScores;
    const gap = top - second;

    // Gap > 0.3 = confident
    // Gap 0.1-0.3 = moderate
    // Gap < 0.1 = uncertain
    if (gap > 0.3) return Math.min(top, 0.95);
    if (gap > 0.1) return Math.min(top, 0.75);
    return Math.min(top, 0.5);
  }

  /**
   * Flag obviously problematic classifications
   */
  static flagProblematicClassifications(
    classification: FileClassificationResult,
    confidence: number
  ): string[] {
    const flags: string[] = [];

    if (confidence < 0.4) {
      flags.push("LOW_CONFIDENCE");
    }

    // Check for equal scores (ambiguous)
    const scores = Object.values(classification.scores);
    if (new Set(scores.map(s => s.toFixed(2))).size < Object.keys(classification.scores).length / 2) {
      flags.push("AMBIGUOUS_SCORES");
    }

    // Check for default scores (uncategorized files)
    if (classification.scores["backend"] === 0.0 && classification.scores["frontend"] === 0.0) {
      flags.push("UNCATEGORIZED");
    }

    return flags;
  }
}
