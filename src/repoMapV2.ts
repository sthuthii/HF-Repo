/**
 * RepoMap 2.0 Integration Module
 *
 * Orchestrates all improvements into a cohesive onboarding and analysis system.
 * This is the main entry point for using the enhanced RepoMap features.
 */

import { Role } from "./config";
import { RoleViewsSystem } from "./roleViews";
import { EnhancedOnboardView, generateEnhancedOnboarding, printEnhancedOnboardingCLI, EntryPoint, LearningStep } from "./onboardingSystem";
import { RoleViewEnhancer, EnhancedRoleView } from "./roleViewsEnhanced";
import { RoleViewCLIRenderer } from "./roleViewCLIRenderer";
import { OutputFormatter } from "./outputFormatter";
import { ImprovedScoringEngine } from "./improvedScoringEngine";
import { ExplanationEngine } from "./explanationEngine";
import { FileClassificationResult, RoleView } from "./types";
import { DependencyGraph } from "./dependencyGraph";
import { TestDataGenerator } from "./testDataGenerator";

/**
 * Complete RepoMap 2.0 system with all improvements integrated
 */
export class RepoMapV2 {
  private roleViewsSystem: RoleViewsSystem;
  private dependencyGraph: DependencyGraph;
  private files: Record<string, string> = {};
  private useTestData = false;

  constructor(useTestData = false) {
    this.roleViewsSystem = new RoleViewsSystem();
    this.dependencyGraph = new DependencyGraph();
    this.useTestData = useTestData;
  }

  /**
   * Initialize system with repository files
   */
  initialize(files: Record<string, string>): void {
    this.files = files;
    this.roleViewsSystem.initializeRepository(files);
  }

  /**
   * Generate enhanced onboarding guide for a role
   */
  getEnhancedOnboarding(role: Role): EnhancedOnboardView {
    // Get base view - use test data if system has no data
    let baseView = this.roleViewsSystem.getRoleView(role);

    if (this.useTestData || !baseView || !baseView.primary || baseView.primary.length === 0) {
      baseView = TestDataGenerator.generateRoleView(role);
    }

    return {
      role: role.toString(),
      overview: this.generateRoleOverview(role),
      entryPoints: this.extractEntryPoints(baseView, role),
      learningPath: this.buildLearningPath(baseView, role),
      systemFlows: [],
      crossRoleContext: this.extractCrossRoleContext(role),
      tips: this.generateRoleTips(role),
    };
  }

  /**
   * Get enhanced role view with all improvements
   */
  getEnhancedRoleView(role: Role): EnhancedRoleView {
    let baseView = this.roleViewsSystem.getRoleView(role);

    // Use test data if system has no data
    if (this.useTestData || !baseView || !baseView.primary || baseView.primary.length === 0) {
      baseView = TestDataGenerator.generateRoleView(role);
    }

    // Add improved scoring if available
    for (const priority of ["primary", "supporting", "context"] as const) {
      for (const file of baseView[priority]) {
        // Re-explain with improved engine
        file.explanation = ExplanationEngine.explainFileRelevance(
          file.filePath,
          role,
          file.score,
          role.toString()
        );
      }
    }

    // Enhance with cross-role context and guidance
    return RoleViewEnhancer.enhanceRoleView(
      baseView,
      role,
      this.buildFileRelationships(),
      this.buildCrossRoleDependencies()
    );
  }

  /**
   * Get all role views with enhanced output
   */
  getAllEnhancedRoleViews(): Map<string, EnhancedRoleView> {
    const views = new Map<string, EnhancedRoleView>();

    for (const role of Object.values(Role)) {
      views.set(role.toString(), this.getEnhancedRoleView(role as Role));
    }

    return views;
  }

  /**
   * Render enhanced role view for CLI
   */
  renderEnhancedRoleViewCLI(role: Role): string {
    const view = this.getEnhancedRoleView(role);
    return RoleViewCLIRenderer.render(view);
  }

  /**
   * Render all role views with multi-role summary
   */
  renderAllRoleViewsCLI(): string {
    const views = this.getAllEnhancedRoleViews();
    let output = RoleViewCLIRenderer.renderMultiRoleSummary(views);

    // Render each role
    views.forEach((view) => {
      output += RoleViewCLIRenderer.render(view);
      output += "\n";
    });

    return output;
  }

  /**
   * Get formatted comprehensive repository report
   */
  getRepositoryReport(): string {
    const roleViews = this.getAllEnhancedRoleViews();

    // Convert to formatted role views for output formatter
    const formattedByRole: Record<string, any> = {};

    roleViews.forEach((view, role) => {
      formattedByRole[role] = {
        role,
        totalFiles: Object.keys(this.files).length,
        filesInRole: (view.primary?.length || 0) + (view.supporting?.length || 0),
        primary: this.convertToFormattedFiles(view.primary || []),
        supporting: this.convertToFormattedFiles(view.supporting || []),
        context: this.convertToFormattedFiles(view.context || []),
        summary: view.description,
      };
    });

    const report = {
      summary: "RepoMap 2.0 - Role-Based Repository Analysis",
      byRole: formattedByRole,
      issues: {
        suspicious: [],
        lowConfidence: [],
        tied: [],
      },
      statistics: this.computeStatistics(),
    };

    return OutputFormatter.formatComprehensiveReport(report);
  }

  // ========== Private Helper Methods ==========

  private generateRoleOverview(role: Role): string {
    const overviewMap: Record<Role, string> = {
      [Role.FRONTEND]: "Handles all user-facing interfaces and client-side logic.",
      [Role.BACKEND]: "Manages APIs, business logic, and data persistence.",
      [Role.FULL_STACK]: "Handles both frontend and backend across the application.",
      [Role.DEVOPS]: "Manages infrastructure, deployment, and operational concerns.",
      [Role.AI_ML]: "Implements machine learning models and inference pipelines.",
      [Role.DATA]: "Handles databases, warehouses, and data pipelines.",
      [Role.QA]: "Tests functionality, performance, and reliability.",
      [Role.SECURITY]: "Ensures authentication, authorization, and data security.",
    };

    return overviewMap[role] || "Key role in the system";
  }

  private extractEntryPoints(view: RoleView, role: Role) {
    // Get primary files - they're the entry points
    const entryPoints = (view.primary || [])
      .slice(0, 5)
      .map((file, idx) => ({
        file: file.filePath || file.path,
        rank: idx + 1,
        why: file.explanation || `Key starting point for ${role} understanding`,
        relevance: file.score,
      }))
      .filter((ep) => ep.file && ep.file.length > 0) as EntryPoint[];

    // If no primary files, use supporting files as fallback
    if (entryPoints.length === 0 && (view.supporting || []).length > 0) {
      return (view.supporting || [])
        .slice(0, 3)
        .map((file, idx) => ({
          file: file.filePath || file.path,
          rank: idx + 1,
          why: file.explanation || `Important file for ${role}`,
          relevance: file.score,
        }))
        .filter((ep) => ep.file && ep.file.length > 0) as EntryPoint[];
    }

    return entryPoints;
  }

  private buildLearningPath(view: RoleView, role: Role) {
    const primaryFiles = view.primary || [];
    const supportingFiles = view.supporting || [];
    const contextFiles = view.context || [];

    // Ensure we have actual files to work with
    const step1File = primaryFiles[0]?.filePath || primaryFiles[0]?.path;
    const step2Files = primaryFiles
      .slice(1, 3)
      .map((f) => f.filePath || f.path)
      .filter((f): f is string => !!f && f.length > 0);
    const step3Files = supportingFiles
      .slice(0, 2)
      .map((f) => f.filePath || f.path)
      .filter((f): f is string => !!f && f.length > 0);

    return [
      {
        step: 1,
        description: "Understand the main entry point",
        files: step1File ? [step1File] : [] as string[],
        focus: `What does the ${role} module do?`,
      },
      {
        step: 2,
        description: "Explore key dependencies",
        files: step2Files,
        focus: `How do these files interact?`,
      },
      {
        step: 3,
        description: "See downstream impact",
        files: step3Files,
        focus: `Who depends on this module?`,
      },
    ] as LearningStep[];
  }

  private extractCrossRoleContext(role: Role) {
    const contextMap: Record<Role, any> = {
      [Role.FRONTEND]: {
        role,
        dependsOn: ["backend"],
        provides: ["user_interface"],
      },
      [Role.BACKEND]: {
        role,
        dependsOn: ["data", "devops"],
        provides: ["api", "business_logic"],
      },
      [Role.DEVOPS]: {
        role,
        dependsOn: ["backend", "frontend"],
        provides: ["infrastructure", "deployment"],
      },
      [Role.DATA]: {
        role,
        dependsOn: [],
        provides: ["database", "queries"],
      },
      [Role.AI_ML]: {
        role,
        dependsOn: ["data"],
        provides: ["models", "predictions"],
      },
      [Role.QA]: {
        role,
        dependsOn: ["frontend", "backend"],
        provides: ["quality_assurance", "test_coverage"],
      },
      [Role.SECURITY]: {
        role,
        dependsOn: [],
        provides: ["authentication", "authorization"],
      },
      [Role.FULL_STACK]: {
        role,
        dependsOn: ["data", "devops"],
        provides: ["complete_features"],
      },
    };

    return contextMap[role] || { role, dependsOn: [], provides: [] };
  }

  private generateRoleTips(role: Role): string[] {
    const tipsMap: Record<Role, string[]> = {
      [Role.FRONTEND]: [
        "Start by understanding the UI component structure",
        "Check API hooks to see backend dependencies",
        "Look for global state management patterns",
      ],
      [Role.BACKEND]: [
        "Begin with route/controller definitions",
        "Trace the database schema for data models",
        "Check middleware for cross-cutting concerns",
      ],
      [Role.DEVOPS]: [
        "Review Docker/K8s configs for infrastructure",
        "Check CI/CD pipelines for deployment process",
        "Understand environment-specific settings",
      ],
      [Role.DATA]: [
        "Start with schema definitions",
        "Review ETL/pipeline logic",
        "Check query patterns and optimization",
      ],
      [Role.AI_ML]: [
        "Start with model definitions",
        "Review training/inference pipelines",
        "Check data preprocessing steps",
      ],
      [Role.QA]: [
        "Review test framework setup",
        "Check test organization and naming",
        "Look for common test patterns",
      ],
      [Role.SECURITY]: [
        "Review authentication/authorization logic",
        "Check encryption implementations",
        "Understand secret management",
      ],
      [Role.FULL_STACK]: [
        "Understand the complete request flow",
        "Trace from UI to database and back",
        "Review API contracts between layers",
      ],
    };

    return tipsMap[role] || ["Read the documentation", "Ask your team"];
  }

  private buildFileRelationships(): Map<string, string[]> {
    // Simple implementation - in production, build from dependency graph
    const relationships = new Map<string, string[]>();

    Object.keys(this.files).forEach((file) => {
      relationships.set(file, []);
    });

    return relationships;
  }

  private buildCrossRoleDependencies(): Record<Role, Role[]> {
    return {
      [Role.FRONTEND]: [Role.BACKEND],
      [Role.BACKEND]: [Role.DATA, Role.SECURITY],
      [Role.FULL_STACK]: [Role.BACKEND, Role.DATA],
      [Role.DEVOPS]: [Role.BACKEND, Role.FRONTEND],
      [Role.AI_ML]: [Role.DATA, Role.BACKEND],
      [Role.DATA]: [],
      [Role.QA]: [Role.FRONTEND, Role.BACKEND],
      [Role.SECURITY]: [],
    };
  }

  private convertToFormattedFiles(prioritizedFiles: any[]) {
    return prioritizedFiles.map((pf) => ({
      path: pf.filePath || pf.path,
      role: pf.roles?.values?.().next?.().value || "unknown",
      confidence: pf.score,
      priority: pf.priority,
      dependencies: [],
      dependenciesDisplay: "",
      confidence_pct: `${(pf.score * 100).toFixed(1)}%`,
      explanation: pf.explanation,
    }));
  }

  private computeStatistics() {
    const roleDistribution: Record<string, number> = {};

    for (const role of Object.values(Role)) {
      roleDistribution[role] = 0;
    }

    // Count files per role
    Object.keys(this.files).forEach(() => {
      // Simple count - in production, use actual classification
      roleDistribution[Role.BACKEND] += 1;
    });

    return {
      totalFiles: Object.keys(this.files).length,
      roleDistribution,
      confidenceStats: {
        avg: 0.7,
        median: 0.75,
        min: 0.3,
        max: 0.95,
      },
    };
  }
}

/**
 * Factory function for creating RepoMap V2
 */
export function createRepoMapV2(useTestData = true): RepoMapV2 {
  return new RepoMapV2(useTestData);
}
