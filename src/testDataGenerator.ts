/**
 * Test Data Generator
 * Creates realistic mock repository data for testing
 * Ensures deterministic output for consistent testing
 */

import { Role } from "./config";
import { FileClassificationResult, RoleView, PrioritizedFile } from "./types";

/**
 * Mock implementation of PrioritizedFile for testing
 */
class MockPrioritizedFile implements PrioritizedFile {
  filePath: string;
  path: string;
  score: number;
  priority: "primary" | "supporting" | "context" | "hidden";
  roles: Set<Role>;
  reason?: string;
  confidence?: number;
  explanation?: string;
  hasDependencies?: boolean;
  hasDependents?: boolean;
  role: Role;

  constructor(
    filePath: string,
    score: number,
    priority: "primary" | "supporting" | "context" | "hidden",
    role: Role,
    explanation?: string
  ) {
    this.filePath = filePath;
    this.path = filePath;
    this.score = score;
    this.priority = priority;
    this.role = role;
    this.roles = new Set([role]);
    this.explanation = explanation;
    this.confidence = score;
  }

  toDict(): Record<string, any> {
    return {
      filePath: this.filePath,
      score: this.score,
      priority: this.priority,
      explanation: this.explanation,
    };
  }
}

export class TestDataGenerator {
  /**
   * Generate realistic test repository files
   */
  static generateTestFiles(): FileClassificationResult[] {
    return [
      // Frontend files
      {
        file: "src/components/UserCard.tsx",
        fileType: ".tsx",
        primaryRole: Role.FRONTEND,
        scores: {
          [Role.FRONTEND]: 0.95,
          [Role.BACKEND]: 0.2,
          [Role.DEVOPS]: 0.05,
          [Role.DATA]: 0.1,
          [Role.QA]: 0.3,
          [Role.SECURITY]: 0.1,
          [Role.AI_ML]: 0.05,
          [Role.FULL_STACK]: 0.6,
        },
        confidence: 0.95,
      },
      {
        file: "src/components/Dashboard.tsx",
        fileType: ".tsx",
        primaryRole: Role.FRONTEND,
        scores: {
          [Role.FRONTEND]: 0.92,
          [Role.BACKEND]: 0.25,
          [Role.DEVOPS]: 0.05,
          [Role.DATA]: 0.15,
          [Role.QA]: 0.35,
          [Role.SECURITY]: 0.08,
          [Role.AI_ML]: 0.05,
          [Role.FULL_STACK]: 0.55,
        },
        confidence: 0.92,
      },
      {
        file: "src/hooks/useAuth.ts",
        fileType: ".ts",
        primaryRole: Role.FRONTEND,
        scores: {
          [Role.FRONTEND]: 0.88,
          [Role.BACKEND]: 0.3,
          [Role.DEVOPS]: 0.05,
          [Role.DATA]: 0.1,
          [Role.QA]: 0.4,
          [Role.SECURITY]: 0.2,
          [Role.AI_ML]: 0.05,
          [Role.FULL_STACK]: 0.65,
        },
        confidence: 0.88,
      },
      // Backend files
      {
        file: "src/api/controllers/UserController.ts",
        fileType: ".ts",
        primaryRole: Role.BACKEND,
        scores: {
          [Role.FRONTEND]: 0.3,
          [Role.BACKEND]: 0.98,
          [Role.DEVOPS]: 0.4,
          [Role.DATA]: 0.2,
          [Role.QA]: 0.5,
          [Role.SECURITY]: 0.6,
          [Role.AI_ML]: 0.05,
          [Role.FULL_STACK]: 0.7,
        },
        confidence: 0.98,
      },
      {
        file: "src/services/AuthService.ts",
        fileType: ".ts",
        primaryRole: Role.BACKEND,
        scores: {
          [Role.FRONTEND]: 0.25,
          [Role.BACKEND]: 0.95,
          [Role.DEVOPS]: 0.35,
          [Role.DATA]: 0.15,
          [Role.QA]: 0.4,
          [Role.SECURITY]: 0.85,
          [Role.AI_ML]: 0.05,
          [Role.FULL_STACK]: 0.65,
        },
        confidence: 0.95,
      },
      {
        file: "src/middleware/errorHandler.ts",
        fileType: ".ts",
        primaryRole: Role.BACKEND,
        scores: {
          [Role.FRONTEND]: 0.1,
          [Role.BACKEND]: 0.9,
          [Role.DEVOPS]: 0.3,
          [Role.DATA]: 0.05,
          [Role.QA]: 0.45,
          [Role.SECURITY]: 0.5,
          [Role.AI_ML]: 0.02,
          [Role.FULL_STACK]: 0.55,
        },
        confidence: 0.9,
      },
      // Data files
      {
        file: "src/models/User.ts",
        fileType: ".ts",
        primaryRole: Role.DATA,
        scores: {
          [Role.FRONTEND]: 0.2,
          [Role.BACKEND]: 0.7,
          [Role.DEVOPS]: 0.1,
          [Role.DATA]: 0.92,
          [Role.QA]: 0.3,
          [Role.SECURITY]: 0.4,
          [Role.AI_ML]: 0.1,
          [Role.FULL_STACK]: 0.6,
        },
        confidence: 0.92,
      },
      {
        file: "src/database/migrations/001_create_users.sql",
        fileType: ".sql",
        primaryRole: Role.DATA,
        scores: {
          [Role.FRONTEND]: 0.05,
          [Role.BACKEND]: 0.5,
          [Role.DEVOPS]: 0.2,
          [Role.DATA]: 0.96,
          [Role.QA]: 0.25,
          [Role.SECURITY]: 0.3,
          [Role.AI_ML]: 0.05,
          [Role.FULL_STACK]: 0.4,
        },
        confidence: 0.96,
      },
      // DevOps files
      {
        file: "Dockerfile",
        fileType: "",
        primaryRole: Role.DEVOPS,
        scores: {
          [Role.FRONTEND]: 0.05,
          [Role.BACKEND]: 0.3,
          [Role.DEVOPS]: 0.98,
          [Role.DATA]: 0.1,
          [Role.QA]: 0.2,
          [Role.SECURITY]: 0.5,
          [Role.AI_ML]: 0.02,
          [Role.FULL_STACK]: 0.3,
        },
        confidence: 0.98,
      },
      {
        file: ".github/workflows/deploy.yml",
        fileType: ".yml",
        primaryRole: Role.DEVOPS,
        scores: {
          [Role.FRONTEND]: 0.05,
          [Role.BACKEND]: 0.2,
          [Role.DEVOPS]: 0.95,
          [Role.DATA]: 0.08,
          [Role.QA]: 0.3,
          [Role.SECURITY]: 0.4,
          [Role.AI_ML]: 0.02,
          [Role.FULL_STACK]: 0.25,
        },
        confidence: 0.95,
      },
      // QA files
      {
        file: "src/__tests__/UserController.test.ts",
        fileType: ".test.ts",
        primaryRole: Role.QA,
        scores: {
          [Role.FRONTEND]: 0.1,
          [Role.BACKEND]: 0.4,
          [Role.DEVOPS]: 0.05,
          [Role.DATA]: 0.1,
          [Role.QA]: 0.95,
          [Role.SECURITY]: 0.2,
          [Role.AI_ML]: 0.02,
          [Role.FULL_STACK]: 0.35,
        },
        confidence: 0.95,
      },
      // Security files
      {
        file: "src/security/rateLimiter.ts",
        fileType: ".ts",
        primaryRole: Role.SECURITY,
        scores: {
          [Role.FRONTEND]: 0.08,
          [Role.BACKEND]: 0.5,
          [Role.DEVOPS]: 0.2,
          [Role.DATA]: 0.05,
          [Role.QA]: 0.3,
          [Role.SECURITY]: 0.96,
          [Role.AI_ML]: 0.02,
          [Role.FULL_STACK]: 0.4,
        },
        confidence: 0.96,
      },
    ];
  }

  /**
   * Generate role view from test files
   */
  static generateRoleView(role: Role): RoleView {
    const files = this.generateTestFiles();
    const filtered = files.filter((f) => f.primaryRole === role || f.scores[role] > 0.4);

    // Prioritize by score for this role
    const prioritized = filtered
      .map((f) => ({
        ...f,
        roleScore: f.scores[role] || 0,
      }))
      .sort((a, b) => b.roleScore - a.roleScore);

    const primary: PrioritizedFile[] = prioritized
      .slice(0, 2)
      .map((f) => new MockPrioritizedFile(
        f.file,
        f.roleScore,
        "primary",
        f.primaryRole as Role,
        this.generateExplanation(f.file, role)
      ));

    const supporting: PrioritizedFile[] = prioritized
      .slice(2, 5)
      .map((f) => new MockPrioritizedFile(
        f.file,
        f.roleScore,
        "supporting",
        f.primaryRole as Role,
        this.generateExplanation(f.file, role)
      ));

    const context: PrioritizedFile[] = prioritized
      .slice(5, 8)
      .map((f) => new MockPrioritizedFile(
        f.file,
        f.roleScore,
        "context",
        f.primaryRole as Role,
        this.generateExplanation(f.file, role)
      ));

    return {
      role: role,
      primary,
      supporting,
      context,
      totalFiles: filtered.length,
    };
  }

  /**
   * Generate accurate explanations based on file path and role
   */
  private static generateExplanation(filePath: string, role: Role): string {
    const explanations: Record<string, Record<Role, string>> = {
      "src/components/UserCard.tsx": {
        [Role.FRONTEND]:
          "React component that displays user information with profile picture",
        [Role.BACKEND]:
          "Frontend component that depends on user API endpoints",
        [Role.DATA]: "Component displays user data from database",
        [Role.DEVOPS]: "Frontend UI component in deployment",
        [Role.QA]: "Component used in user profile tests",
        [Role.SECURITY]: "Component displays user data securely",
        [Role.AI_ML]: "Component shows user-related ML predictions",
        [Role.FULL_STACK]: "Full-stack user display component",
      },
      "src/api/controllers/UserController.ts": {
        [Role.BACKEND]:
          "Handles all user-related API requests and responses",
        [Role.FRONTEND]:
          "Backend API that your frontend depends on for user data",
        [Role.DATA]: "Controller queries user data from database",
        [Role.DEVOPS]: "Backend service requiring deployment configuration",
        [Role.QA]: "Backend API endpoints need integration testing",
        [Role.SECURITY]:
          "Requires authentication and authorization checks",
        [Role.AI_ML]: "API provides user data for ML models",
        [Role.FULL_STACK]: "Core API for user management",
      },
      "src/services/AuthService.ts": {
        [Role.BACKEND]:
          "Authentication and authorization business logic",
        [Role.FRONTEND]:
          "Backend service your frontend uses for login/logout",
        [Role.DATA]: "Service verifies user credentials",
        [Role.DEVOPS]: "Critical service requiring high availability",
        [Role.QA]: "Service needs comprehensive auth testing",
        [Role.SECURITY]:
          "Core security component - handles JWT, OAuth, RBAC",
        [Role.AI_ML]: "Service authenticates ML model API access",
        [Role.FULL_STACK]: "Central authentication service",
      },
    };

    return (
      explanations[filePath]?.[role] ||
      `Key file for ${role} role in this repository`
    );
  }

  /**
   * Generate realistic dependency relationships
   */
  static generateDependencies(): Record<string, string[]> {
    return {
      "src/components/UserCard.tsx": [
        "src/hooks/useAuth.ts",
        "src/api/UserApi.ts",
      ],
      "src/api/controllers/UserController.ts": [
        "src/services/AuthService.ts",
        "src/models/User.ts",
      ],
      "src/services/AuthService.ts": ["src/security/rateLimiter.ts"],
      "src/middleware/errorHandler.ts": [
        "src/api/controllers/UserController.ts",
      ],
    };
  }

  /**
   * Format score as percentage (2 decimals)
   */
  static formatScore(score: number): string {
    return `${(score * 100).toFixed(0)}%`;
  }
}
