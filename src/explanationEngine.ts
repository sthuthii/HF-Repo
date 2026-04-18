/**
 * Explanation engine for generating role-specific file descriptions.
 */

import { Role } from "./config";

export class ExplanationEngine {
  /**
   * Generate concise, specific explanation for why a file is shown for a role.
   */
  static explainFileRelevance(
    filePath: string,
    role: Role,
    score: number,
    primaryRole: string,
    reason: string = ""
  ): string {
    const fileType = filePath.split(".").pop()?.toLowerCase() || "";
    const fileName = filePath.split("/").pop() || filePath;
    const dirPath = filePath.includes("/") ? filePath.substring(0, filePath.lastIndexOf("/")) : "";

    // Build concise explanation based on file characteristics
    // Prioritize specific, actionable info over generic boilerplate

    if (score > 0.7) {
      // PRIMARY files
      if (filePath.toLowerCase().includes("controller") || filePath.toLowerCase().includes("handler")) {
        return `API request handler - core ${role} logic for processing requests.`;
      } else if (
        filePath.toLowerCase().includes("component") ||
        filePath.toLowerCase().includes("tsx") ||
        filePath.toLowerCase().includes("jsx")
      ) {
        return `UI component - renders the ${role} interface.`;
      } else if (
        filePath.toLowerCase().includes("service") &&
        filePath.toLowerCase().includes("auth")
      ) {
        return `Authentication service - handles JWT tokens, login/logout for backend security.`;
      } else if (filePath.toLowerCase().includes("service")) {
        return `Business logic service - core ${role} operations and data processing.`;
      } else if (filePath.toLowerCase().includes("model")) {
        return `Data model - defines schema and structure for ${role} entities.`;
      } else if (["dockerfile", "yml", "yaml"].includes(fileType)) {
        return `Infrastructure definition - configures ${role} deployment and runtime.`;
      } else if (filePath.toLowerCase().includes("test")) {
        return `Test suite - validates ${role} functionality and edge cases.`;
      } else {
        return `Core ${role} file (${(score * 100).toFixed(0)}%) - directly used in ${role} workflow.`;
      }
    } else if (score > 0.4) {
      // SUPPORTING files
      if (filePath.toLowerCase().includes("middleware")) {
        return `Middleware component - processes requests before ${role} handlers.`;
      } else if (filePath.toLowerCase().includes("auth")) {
        return `Authentication logic - secures ${role} operations.`;
      } else if (filePath.toLowerCase().includes("model")) {
        return `Data model - shared schema used by ${role} modules.`;
      } else if (
        filePath.toLowerCase().includes("util") ||
        filePath.toLowerCase().includes("helper")
      ) {
        return `Utility functions - provides shared helpers for ${role} code.`;
      } else if (
        filePath.toLowerCase().includes("config") ||
        filePath.toLowerCase().includes("settings")
      ) {
        return `Configuration - sets parameters affecting ${role} behavior.`;
      } else if (filePath.toLowerCase().includes("test")) {
        return `Test file - ensures ${role} code quality and correctness.`;
      } else {
        return `Related dependency (${(score * 100).toFixed(0)}%) - supports ${role} operations.`;
      }
    } else {
      // CONTEXT files
      if (filePath.toLowerCase().includes("readme")) {
        return `Documentation - explains ${role} features and usage.`;
      } else if (filePath.toLowerCase().includes("test")) {
        return `Integration test - shows how ${role} components work together.`;
      } else if (
        filePath.toLowerCase().includes("api") &&
        role === Role.FRONTEND
      ) {
        return `Backend API - frontend calls this to fetch/update data.`;
      } else if (
        filePath.toLowerCase().includes("component") &&
        role === Role.BACKEND
      ) {
        return `UI component - frontend code that calls your backend APIs.`;
      } else if (filePath.toLowerCase().includes("auth")) {
        return `Authentication - ${role} may need to understand security requirements.`;
      } else {
        return `Related file - provides context for understanding ${role} role.`;
      }
    }
  }

  /**
   * Get role-specific focus areas.
   */
  static getRoleFocus(role: Role | string): string {
    const focusMap: Record<string, string> = {
      frontend:
        "UI components, state management, styling, and user interactions",
      backend: "API endpoints, business logic, database queries, validation",
      devops: "deployment configs, CI/CD pipelines, infrastructure, monitoring",
      security: "authentication, authorization, encryption, access control",
      ai_ml: "model architecture, training logic, feature engineering",
      data: "data pipelines, ETL processes, database schemas",
      qa: "test coverage, test scenarios, validation logic",
      full_stack: "full data flow from UI to database, integration points",
    };

    return focusMap[role] || "general architecture";
  }

  /**
   * Generate a summary for a file based on role.
   */
  static summarizeFileForRole(
    fileContent: string,
    role: Role | string,
    filePath: string = ""
  ): string {
    const focus = this.getRoleFocus(role);

    return `Summarize this code for a ${role} engineer in 2-3 sentences.

Focus on ${focus}

File: ${filePath}
Code:
\`\`\`
${fileContent.substring(0, 2000)}
\`\`\`

Summary for ${role}:`;
  }

  /**
   * Explain a data flow path.
   */
  static explainDataFlow(
    path: string[],
    sourceFile: string,
    targetFile: string
  ): string {
    const pathStr = path.join(" → ");

    return `Explain this data flow path in one sentence:

${sourceFile} → ... → ${targetFile}

Path: ${pathStr}

Explanation:`;
  }
}
