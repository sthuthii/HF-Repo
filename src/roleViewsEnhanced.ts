/**
 * Enhanced Role-Based Views with Cross-Role Awareness
 *
 * Extends the basic role views with:
 * - Cross-role dependencies (what other roles depend on this)
 * - Architectural context (where this fits in the system)
 * - Relevant APIs and interfaces
 * - Clear importance hierarchy
 */

import { Role } from "./config";
import { PrioritizedFile, RoleView } from "./types";

/**
 * Enhanced view with cross-role context
 */
export interface EnhancedRoleView extends RoleView {
  role: string;
  title: string; // e.g., "Frontend Engineer View"
  description: string; // What this role focuses on
  crossRoleContext: CrossRoleLinks;
  warnings?: string[]; // Important warnings
  mustKnow: MustKnowSection; // Critical knowledge
}

/**
 * Cross-role dependencies and context
 */
export interface CrossRoleLinks {
  dependsOn: RoleDependency[]; // Roles this depends on
  providesTo: RoleDependency[]; // Roles that depend on this
  sharedFiles?: string[]; // Files used by multiple roles
}

/**
 * Dependency to another role
 */
export interface RoleDependency {
  role: Role;
  reason: string; // Why this dependency exists
  keyInterfaces?: string[]; // Important APIs/interfaces
}

/**
 * Critical information for understanding the role
 */
export interface MustKnowSection {
  entryPoints: FileWithContext[]; // Where to start
  keyPatterns: string[]; // Important patterns
  commonErrors: string[]; // Common mistakes
  quickWins: string[]; // Easy wins for new developers
}

/**
 * File with contextual information
 */
export interface FileWithContext {
  path: string;
  importance: "critical" | "important" | "supporting";
  why: string; // Why this matters
}

/**
 * Generate enhanced role view with cross-role awareness
 */
export class RoleViewEnhancer {
  /**
   * Enhance a basic role view with cross-role context
   */
  static enhanceRoleView(
    baseView: RoleView,
    role: Role,
    allFiles: Map<string, string[]>, // fileName -> list of dependent files
    crossRoleDependencies?: Record<Role, Role[]>
  ): EnhancedRoleView {
    const title = this.generateTitle(role);
    const description = this.generateDescription(role);
    const crossRoleContext = this.extractCrossRoleContext(role, crossRoleDependencies);
    const mustKnow = this.generateMustKnowSection(role, baseView);
    const warnings = this.generateWarnings(role, baseView);

    return {
      ...baseView,
      role: role.toString(),
      title,
      description,
      crossRoleContext,
      warnings,
      mustKnow,
    };
  }

  /**
   * Generate a friendly title for the role view
   */
  private static generateTitle(role: Role): string {
    const titles: Record<Role, string> = {
      [Role.FRONTEND]: "🎨 Frontend Developer View",
      [Role.BACKEND]: "⚙️ Backend Engineer View",
      [Role.FULL_STACK]: "🚀 Full-Stack Developer View",
      [Role.DEVOPS]: "🐳 DevOps Engineer View",
      [Role.AI_ML]: "🤖 AI/ML Engineer View",
      [Role.DATA]: "📊 Data Engineer View",
      [Role.QA]: "🧪 QA Engineer View",
      [Role.SECURITY]: "🔐 Security Engineer View",
    };
    return titles[role] || `${role} View`;
  }

  /**
   * Generate a concise description of what this role focuses on
   */
  private static generateDescription(role: Role): string {
    const descriptions: Record<Role, string> = {
      [Role.FRONTEND]:
        "Focus on UI components, state management, user interactions, and styling.",
      [Role.BACKEND]:
        "Focus on APIs, business logic, databases, and server-side validation.",
      [Role.FULL_STACK]:
        "Work across the entire stack from UI to database and deployment.",
      [Role.DEVOPS]:
        "Focus on infrastructure, deployment pipelines, containerization, and monitoring.",
      [Role.AI_ML]:
        "Focus on model architecture, training pipelines, feature engineering, and inference.",
      [Role.DATA]:
        "Focus on data schemas, pipelines, warehousing, and analytics.",
      [Role.QA]:
        "Focus on test coverage, test strategies, automation, and quality assurance.",
      [Role.SECURITY]:
        "Focus on authentication, authorization, encryption, and vulnerability prevention.",
    };
    return descriptions[role] || "Key role in the system";
  }

  /**
   * Extract cross-role context and dependencies
   */
  private static extractCrossRoleContext(
    role: Role,
    crossRoleDeps?: Record<Role, Role[]>
  ): CrossRoleLinks {
    const dependencies: Record<Role, RoleDependency[]> = {
      [Role.FRONTEND]: [
        {
          role: Role.BACKEND,
          reason: "Fetch data and execute business logic through APIs",
          keyInterfaces: ["GET /api/*", "POST /api/*"],
        },
      ],
      [Role.BACKEND]: [
        {
          role: Role.DATA,
          reason: "Store and retrieve data from databases",
          keyInterfaces: ["SQL queries", "ORM models"],
        },
        {
          role: Role.SECURITY,
          reason: "Implement authentication and authorization",
          keyInterfaces: ["JWT", "OAuth", "RBAC"],
        },
      ],
      [Role.FULL_STACK]: [
        {
          role: Role.DEVOPS,
          reason: "Deploy and scale the application",
          keyInterfaces: ["Docker", "K8s manifests"],
        },
      ],
      [Role.DEVOPS]: [
        {
          role: Role.BACKEND,
          reason: "Deploy backend services and APIs",
          keyInterfaces: ["Docker images", "Service configs"],
        },
        {
          role: Role.FRONTEND,
          reason: "Serve frontend assets and CDN",
          keyInterfaces: ["Build artifacts", "Static files"],
        },
      ],
      [Role.AI_ML]: [
        {
          role: Role.DATA,
          reason: "Access and process training data",
          keyInterfaces: ["Data pipelines", "Data loaders"],
        },
        {
          role: Role.BACKEND,
          reason: "Integrate models into production APIs",
          keyInterfaces: ["Model inference", "API endpoints"],
        },
      ],
      [Role.DATA]: [
        {
          role: Role.BACKEND,
          reason: "Provide data to backend queries",
          keyInterfaces: ["Database schemas", "Stored procedures"],
        },
      ],
      [Role.QA]: [
        {
          role: Role.FRONTEND,
          reason: "Test UI components and user flows",
          keyInterfaces: ["Selectors", "Test frameworks"],
        },
        {
          role: Role.BACKEND,
          reason: "Test APIs and business logic",
          keyInterfaces: ["API endpoints", "Test fixtures"],
        },
      ],
      [Role.SECURITY]: [
        {
          role: Role.BACKEND,
          reason: "Implement security patterns in APIs",
          keyInterfaces: ["Auth middleware", "Encryption"],
        },
      ],
    };

    const dependsOn = dependencies[role] || [];

    return {
      dependsOn,
      providesTo: this.extractProvides(role),
      sharedFiles: [],
    };
  }

  /**
   * Determine what this role provides to other roles
   */
  private static extractProvides(role: Role): RoleDependency[] {
    const provides: Record<Role, RoleDependency[]> = {
      [Role.BACKEND]: [
        {
          role: Role.FRONTEND,
          reason: "Frontend calls your APIs to display data",
          keyInterfaces: ["REST endpoints", "GraphQL"],
        },
        {
          role: Role.DEVOPS,
          reason: "DevOps deploys your backend services",
          keyInterfaces: ["Docker configs", "Health checks"],
        },
      ],
      [Role.FRONTEND]: [
        {
          role: Role.BACKEND,
          reason: "Backend needs to understand what frontend displays",
          keyInterfaces: ["Component types", "State shape"],
        },
      ],
      [Role.FULL_STACK]: [],
      [Role.DEVOPS]: [
        {
          role: Role.BACKEND,
          reason: "Deployment and infrastructure setup",
          keyInterfaces: ["Deploy scripts", "Config templates"],
        },
      ],
      [Role.AI_ML]: [],
      [Role.QA]: [],
      [Role.SECURITY]: [],
      [Role.DATA]: [
        {
          role: Role.BACKEND,
          reason: "Backend uses data schemas and queries",
          keyInterfaces: ["SQL schemas", "Query patterns"],
        },
        {
          role: Role.AI_ML,
          reason: "ML models need training data",
          keyInterfaces: ["Data exports", "Data pipelines"],
        },
      ],
    };

    return provides[role] || [];
  }

  /**
   * Generate critical information every role must know
   */
  private static generateMustKnowSection(
    role: Role,
    view: RoleView
  ): MustKnowSection {
    const keyEntryPoints = (view.primary || [])
      .slice(0, 2)
      .map((pf) => ({
        path: pf.filePath || pf.path || "unknown",
        importance: "critical" as const,
        why: pf.explanation || "Key entry point for this role",
      }));

    const patterns: Record<Role, string[]> = {
      [Role.FRONTEND]: [
        "Component composition patterns",
        "State management with hooks",
        "Styling with CSS/SCSS modules",
      ],
      [Role.BACKEND]: [
        "MVC/Service pattern for code organization",
        "Middleware for cross-cutting concerns",
        "Error handling and validation",
      ],
      [Role.DEVOPS]: [
        "Infrastructure as code (Terraform/Ansible)",
        "Container orchestration (Docker/K8s)",
        "CI/CD pipeline stages",
      ],
      [Role.AI_ML]: [
        "Model training and evaluation",
        "Data preprocessing and feature engineering",
        "Hyperparameter tuning",
      ],
      [Role.DATA]: [
        "ETL pipeline design",
        "SQL optimization and indexing",
        "Data schema normalization",
      ],
      [Role.QA]: [
        "Test pyramid (unit/integration/e2e)",
        "Test data and fixtures",
        "Continuous testing in CI/CD",
      ],
      [Role.SECURITY]: [
        "Principle of least privilege",
        "Defense in depth",
        "Security by design",
      ],
      [Role.FULL_STACK]: [
        "Full request lifecycle understanding",
        "Client-server communication patterns",
        "Database to UI data flow",
      ],
    };

    const errors: Record<Role, string[]> = {
      [Role.FRONTEND]: [
        "Uncontrolled component state causing bugs",
        "Missing error boundaries causing cascading failures",
        "Performance issues from unnecessary re-renders",
      ],
      [Role.BACKEND]: [
        "N+1 queries causing database overload",
        "Unhandled exceptions crashing services",
        "Missing input validation allowing injections",
      ],
      [Role.DEVOPS]: [
        "Hardcoded secrets in configuration",
        "Single points of failure in infrastructure",
        "Inadequate monitoring and alerting",
      ],
      [Role.DATA]: [
        "Data quality issues not caught upstream",
        "Inefficient queries causing pipeline slowdowns",
        "Data consistency problems from poor schema design",
      ],
      [Role.QA]: [
        "Tests too tightly coupled to implementation",
        "Flaky tests causing false negatives",
        "Insufficient edge case coverage",
      ],
      [Role.SECURITY]: [
        "Weak password policies",
        "Unencrypted sensitive data",
        "Missing rate limiting on APIs",
      ],
      [Role.AI_ML]: [
        "Overfitting on training data",
        "Data leakage between train/test splits",
        "Model drift without monitoring",
      ],
      [Role.FULL_STACK]: [
        "Losing context switching between frontend and backend",
        "Misaligned API contracts",
        "Inconsistent error handling across layers",
      ],
    };

    const wins: Record<Role, string[]> = {
      [Role.FRONTEND]: [
        "Fix a styling bug for quick UI improvement",
        "Add a simple component feature",
        "Improve accessibility of existing components",
      ],
      [Role.BACKEND]: [
        "Add a missing API endpoint",
        "Improve database query performance",
        "Add input validation to an endpoint",
      ],
      [Role.DEVOPS]: [
        "Set up a new environment",
        "Improve deployment process speed",
        "Add monitoring dashboard",
      ],
      [Role.DATA]: [
        "Optimize a slow query",
        "Add data validation checks",
        "Document schema changes",
      ],
      [Role.QA]: [
        "Write tests for a critical feature",
        "Fix flaky test to stabilize CI/CD",
        "Improve test coverage",
      ],
      [Role.SECURITY]: [
        "Audit for common vulnerabilities",
        "Implement stronger password policy",
        "Add rate limiting to an endpoint",
      ],
      [Role.AI_ML]: [
        "Improve model accuracy with feature engineering",
        "Set up model evaluation pipeline",
        "Document model assumptions",
      ],
      [Role.FULL_STACK]: [
        "Trace full request through entire system",
        "Fix a complete feature end-to-end",
        "Improve API documentation",
      ],
    };

    return {
      entryPoints: keyEntryPoints,
      keyPatterns: patterns[role] || [],
      commonErrors: errors[role] || [],
      quickWins: wins[role] || [],
    };
  }

  /**
   * Generate warnings specific to the role
   */
  private static generateWarnings(role: Role, view: RoleView): string[] {
    const warnings: Record<Role, string[]> = {
      [Role.FRONTEND]: view.primary.length === 0
        ? ["No primary frontend files found - architecture may not be separated"]
        : [],
      [Role.BACKEND]: view.supporting.length === 0
        ? ["Backend has no dependencies - check if properly analyzed"]
        : [],
      [Role.DEVOPS]: view.context.length < 2
        ? ["Limited infrastructure files - DevOps concerns may not be documented"]
        : [],
      [Role.DATA]: [],
      [Role.AI_ML]: [],
      [Role.QA]: view.primary.length === 0
        ? ["No test files found - tests may be missing or misclassified"]
        : [],
      [Role.SECURITY]: [],
      [Role.FULL_STACK]: [],
    };

    return warnings[role] || [];
  }
}
