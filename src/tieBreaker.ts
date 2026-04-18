/**
 * Tie-Breaker for ambiguous classifications.
 * 
 * When multiple roles have equal or very similar scores,
 * use file extension and path heuristics to break ties.
 */

import { Role } from "./config";

export interface TieBreakerResult {
  role: string;
  confidence: number;
  reason: string;
  isTie: boolean;
  tiedRoles?: string[];
}

export class TieBreaker {
  private static readonly TIE_THRESHOLD = 0.05;

  /**
   * Detect if scores are tied.
   */
  static detectTie(scores: Record<string, number>): {
    isTie: boolean;
    tiedRoles: string[];
    maxScore: number;
  } {
    const entries = Object.entries(scores).sort(([, a], [, b]) => b - a);

    if (entries.length < 2) {
      return { isTie: false, tiedRoles: [], maxScore: entries[0]?.[1] || 0 };
    }

    const [topRole, topScore] = entries[0];
    const secondScore = entries[1][1];

    const diff = topScore - secondScore;

    if (diff < this.TIE_THRESHOLD) {
      // Collect all tied roles (within threshold)
      const tiedRoles = entries
        .filter(([, score]) => score >= topScore - this.TIE_THRESHOLD)
        .map(([role]) => role);

      return { isTie: true, tiedRoles, maxScore: topScore };
    }

    return { isTie: false, tiedRoles: [], maxScore: topScore };
  }

  /**
   * Break a tie using file characteristics.
   */
  static breakTie(
    file: string,
    tiedRoles: string[],
    scores: Record<string, number>
  ): TieBreakerResult {
    if (tiedRoles.length === 1) {
      // Not actually a tie, just pick the one
      const role = tiedRoles[0];
      return {
        role,
        confidence: scores[role],
        reason: "No tie",
        isTie: false,
      };
    }

    const fileLower = file.toLowerCase();
    const fileName = file.split("/").pop()?.toLowerCase() || "";
    const ext = fileName.split(".").pop() || "";

    // EXTENSION-BASED HEURISTICS
    const extHints = this.getExtensionHints(ext);
    for (const role of extHints) {
      if (tiedRoles.includes(role)) {
        return {
          role,
          confidence: scores[role],
          reason: `Extension .${ext} suggests ${role}`,
          isTie: true,
          tiedRoles,
        };
      }
    }

    // PATH-BASED HEURISTICS
    const pathHints = this.getPathHints(fileLower);
    for (const role of pathHints) {
      if (tiedRoles.includes(role)) {
        return {
          role,
          confidence: scores[role],
          reason: `Path contains "${this.extractPathClue(fileLower)}" → ${role}`,
          isTie: true,
          tiedRoles,
        };
      }
    }

    // FILENAME-BASED HEURISTICS
    const nameHints = this.getFilenameHints(fileName);
    for (const role of nameHints) {
      if (tiedRoles.includes(role)) {
        return {
          role,
          confidence: scores[role],
          reason: `Filename pattern suggests ${role}`,
          isTie: true,
          tiedRoles,
        };
      }
    }

    // If no heuristic matches, pick the first tied role and mark as AMBIGUOUS
    const fallback = tiedRoles[0];
    return {
      role: fallback,
      confidence: scores[fallback],
      reason: `Ambiguous tie between ${tiedRoles.join(", ")} - defaulted to ${fallback}`,
      isTie: true,
      tiedRoles,
    };
  }

  /**
   * Get role hints from file extension.
   */
  private static getExtensionHints(ext: string): string[] {
    const hints: Record<string, string[]> = {
      py: [Role.AI_ML, Role.DATA, Role.BACKEND],
      sql: [Role.DATA, Role.BACKEND],
      test: [Role.QA, Role.BACKEND],
      spec: [Role.QA, Role.FRONTEND],
      yaml: [Role.DEVOPS, Role.DATA],
      yml: [Role.DEVOPS, Role.DATA],
      json: [Role.BACKEND, Role.DEVOPS],
      tsx: [Role.FRONTEND, Role.FULL_STACK],
      jsx: [Role.FRONTEND],
      ts: [Role.BACKEND, Role.FRONTEND],
      js: [Role.BACKEND, Role.FRONTEND],
    };

    return hints[ext.toLowerCase()] || [];
  }

  /**
   * Get role hints from file path.
   */
  private static getPathHints(fileLower: string): string[] {
    if (fileLower.includes("test") || fileLower.includes("spec")) {
      return [Role.QA];
    }
    if (fileLower.includes("component")) {
      return [Role.FRONTEND];
    }
    if (fileLower.includes("service")) {
      return [Role.BACKEND];
    }
    if (fileLower.includes("model")) {
      return [Role.AI_ML, Role.BACKEND];
    }
    if (fileLower.includes("data")) {
      return [Role.DATA, Role.BACKEND];
    }
    if (fileLower.includes("infra") || fileLower.includes("deploy")) {
      return [Role.DEVOPS];
    }

    return [];
  }

  /**
   * Get role hints from filename.
   */
  private static getFilenameHints(fileName: string): string[] {
    if (
      fileName.includes(".test.") ||
      fileName.includes(".spec.") ||
      fileName.startsWith("test")
    ) {
      return [Role.QA];
    }
    if (
      fileName.endsWith("component.tsx") ||
      fileName.endsWith("component.jsx")
    ) {
      return [Role.FRONTEND];
    }
    if (fileName.includes("config")) {
      return [Role.BACKEND, Role.DEVOPS];
    }
    if (fileName.includes("index")) {
      return []; // Index files are ambiguous
    }

    return [];
  }

  /**
   * Extract the clue from the path for explanation.
   */
  private static extractPathClue(fileLower: string): string {
    const clues = [
      "test",
      "spec",
      "component",
      "service",
      "model",
      "data",
      "infra",
      "deploy",
    ];

    for (const clue of clues) {
      if (fileLower.includes(clue)) {
        return clue;
      }
    }

    return "path";
  }
}
