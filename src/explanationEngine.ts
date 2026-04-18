/**
 * Explanation engine for generating role-specific file descriptions.
 * 
 * Generates contextual, data-driven explanations instead of generic templates.
 * Explains WHAT the file does, WHY it matters for the role, and WHERE it fits.
 */

import { Role } from "./config";

interface FileContext {
  path: string;
  role: Role;
  score: number;
  primaryRole: string;
  dependents?: string[]; // Files that depend on this
  dependencies?: string[]; // Files this depends on
}

export class ExplanationEngine {
  /**
   * Generate concise, specific explanation for why a file is shown for a role.
   * 
   * Strategy:
   * 1. Determine file's FUNCTION (what it does)
   * 2. Explain RELEVANCE to role (why it matters)
   * 3. Show POSITION in architecture (where it fits)
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

    // Use the reason if provided (from higher-level analysis)
    if (reason && reason.length > 5) {
      return reason;
    }

    // Determine file function first
    const fileFunction = ExplanationEngine.determineFileFunction(filePath, fileType);
    
    // Determine relevance level
    const priority = ExplanationEngine.determinePriority(score);
    
    // Build role-specific relevance
    const roleContext = ExplanationEngine.getRoleContext(role, fileFunction, primaryRole);

    // Combine into concise explanation
    return ExplanationEngine.buildExplanation(
      fileFunction,
      roleContext,
      priority,
      score
    );
  }

  /**
   * Determine what the file fundamentally does (not role-specific)
   */
  private static determineFileFunction(filePath: string, fileType: string): string {
    const lowerPath = filePath.toLowerCase();

    // API/Request Handling
    if (
      lowerPath.includes("controller") ||
      lowerPath.includes("handler") ||
      lowerPath.includes("route")
    ) {
      return "request_handler";
    }

    // UI Component
    if (
      lowerPath.includes("component") ||
      lowerPath.includes("page") ||
      lowerPath.includes("screen") ||
      fileType === "tsx" ||
      fileType === "jsx"
    ) {
      return "ui_component";
    }

    // Business Logic Service
    if (
      lowerPath.includes("service") &&
      !lowerPath.includes("auth")
    ) {
      return "business_service";
    }

    // Authentication/Authorization
    if (lowerPath.includes("auth")) {
      return "auth_service";
    }

    // Data Model/Schema
    if (
      lowerPath.includes("model") ||
      lowerPath.includes("schema") ||
      lowerPath.includes("entity") ||
      fileType === "sql"
    ) {
      return "data_model";
    }

    // Middleware
    if (lowerPath.includes("middleware")) {
      return "middleware";
    }

    // Configuration
    if (lowerPath.includes("config") || lowerPath.includes("settings")) {
      return "configuration";
    }

    // Utilities/Helpers
    if (
      lowerPath.includes("util") ||
      lowerPath.includes("helper") ||
      lowerPath.includes("lib")
    ) {
      return "utility";
    }

    // Testing
    if (
      lowerPath.includes("test") ||
      lowerPath.includes("spec") ||
      fileType === "spec"
    ) {
      return "test_suite";
    }

    // Infrastructure/Deployment
    if (
      fileType === "dockerfile" ||
      fileType === "yml" ||
      fileType === "yaml" ||
      lowerPath.includes("docker") ||
      lowerPath.includes("terraform") ||
      lowerPath.includes("helm")
    ) {
      return "infrastructure";
    }

    // Documentation
    if (fileType === "md" || lowerPath.includes("readme")) {
      return "documentation";
    }

    return "general_code";
  }

  /**
   * Determine priority level from score
   */
  private static determinePriority(
    score: number
  ): "primary" | "supporting" | "context" {
    if (score >= 0.7) return "primary";
    if (score >= 0.4) return "supporting";
    return "context";
  }

  /**
   * Get role-specific context for why file matters
   */
  private static getRoleContext(
    role: Role,
    fileFunction: string,
    primaryRole: string
  ): string {
    // Role doesn't match file's primary role
    if (role !== primaryRole) {
      return ExplanationEngine.getCrossRoleContext(role, fileFunction, primaryRole);
    }

    // Role matches - explain core relevance
    switch (fileFunction) {
      case "request_handler":
        return "Handles incoming requests and routing";
      case "ui_component":
        return "Renders UI and manages user interactions";
      case "business_service":
        return "Contains core business logic and operations";
      case "auth_service":
        return "Manages authentication and authorization";
      case "data_model":
        return "Defines data structures and schema";
      case "middleware":
        return "Intercepts and processes requests";
      case "configuration":
        return "Controls behavior and environment settings";
      case "utility":
        return "Provides shared helpers and utilities";
      case "test_suite":
        return "Validates functionality and correctness";
      case "infrastructure":
        return "Manages deployment and infrastructure";
      case "documentation":
        return "Explains features and usage";
      default:
        return "Contributes to core functionality";
    }
  }

  /**
   * Get context when role doesn't match file's primary role
   */
  private static getCrossRoleContext(
    role: Role,
    fileFunction: string,
    primaryRole: string
  ): string {
    // Frontend looking at backend
    if (role === Role.FRONTEND && primaryRole === Role.BACKEND) {
      if (fileFunction === "request_handler")
        return "Backend API that frontend depends on";
      if (fileFunction === "data_model") return "Data structure returned by API";
      if (fileFunction === "business_service") return "Business logic backend exposes";
      return "Backend code that supports frontend";
    }

    // Backend looking at frontend
    if (role === Role.BACKEND && primaryRole === Role.FRONTEND) {
      if (fileFunction === "ui_component")
        return "Frontend UI that calls your APIs";
      if (fileFunction === "request_handler")
        return "Frontend route you need to support";
      return "Frontend code that consumes your APIs";
    }

    // Anything looking at DevOps infrastructure
    if (role !== Role.DEVOPS && primaryRole === Role.DEVOPS) {
      return "Infrastructure requirements for this module";
    }

    // DevOps looking at application code
    if (role === Role.DEVOPS) {
      if (fileFunction === "infrastructure")
        return "Deployable infrastructure definition";
      if (fileFunction === "configuration") return "Environment configuration";
      return "Application code needing deployment";
    }

    // Security role looking at anything
    if (role === Role.SECURITY) {
      if (fileFunction === "auth_service")
        return "Authentication implementation to review";
      if (fileFunction === "request_handler")
        return "API endpoints that need security checks";
      if (fileFunction === "data_model")
        return "Data structures with potential sensitivities";
      return "Component with potential security implications";
    }

    return `Related to ${primaryRole} module`;
  }

  /**
   * Build final concise explanation
   */
  private static buildExplanation(
    fileFunction: string,
    roleContext: string,
    priority: string,
    score: number
  ): string {
    const scorePercent = (score * 100).toFixed(0);

    if (priority === "primary") {
      return `${roleContext} (${scorePercent}%) - essential for this role`;
    } else if (priority === "supporting") {
      return `${roleContext} (${scorePercent}%) - important dependency`;
    } else {
      return `${roleContext} (${scorePercent}%) - useful context`;
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
