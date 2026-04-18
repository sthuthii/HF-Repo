import path from "path";
import Database from "better-sqlite3";
import { Role } from "./config";
import { DependencyGraph } from "./dependencyGraph";

/**
 * Guided entry point per role with importance explanation
 */
export interface EntryPoint {
  file: string;
  rank: number; // 1 = most important
  why: string; // Why this file is important
  relevance: number; // 0-1 score
}

/**
 * Learning path: step-by-step progression
 */
export interface LearningStep {
  step: number;
  description: string; // What to learn
  files: string[]; // Which files to read
  focus: string; // What to focus on
}

/**
 * System flow explanation
 */
export interface SystemFlow {
  name: string;
  description: string;
  flow: string[]; // Sequence of files involved
  explanation: string; // Human-readable flow
  confidence: number; // How certain is this flow
}

/**
 * Cross-role context
 */
export interface CrossRoleContext {
  role: string;
  dependsOn: string[]; // Other roles this depends on
  provides: string[]; // What this role provides to others
  keyAPIs?: string[]; // Important APIs or interfaces
}

/**
 * Complete onboarding view with learning paths
 */
export interface EnhancedOnboardView {
  role: string;
  overview: string; // 1-2 sentence what this role does
  entryPoints: EntryPoint[]; // 3-5 key files to start
  learningPath: LearningStep[]; // Progressive steps
  systemFlows: SystemFlow[]; // 1-2 key flows
  crossRoleContext: CrossRoleContext; // How this role connects
  tips: string[]; // Role-specific tips
}

export function generateEnhancedOnboarding(
  dbPath: string,
  role: string,
  depGraph?: DependencyGraph
): EnhancedOnboardView {
  const db = new Database(dbPath);

  // Get files for this role
  const rows = db
    .prepare(
      `SELECT path, purpose as summary, dependencies, role_scores 
       FROM files 
       WHERE primary_role = ? 
       ORDER BY json_extract(role_scores, '$." + ${role} + "') DESC`
    )
    .all(role) as any[];

  if (rows.length === 0) {
    db.close();
    return getDefaultOnboarding(role);
  }

  // Parse scored files
  const scoredFiles = rows
    .map((row) => {
      try {
        const scores = JSON.parse(row.role_scores || "{}");
        const score = scores[role] || 0;
        return { path: row.path.replace(/\\/g, "/"), score, summary: row.summary, deps: row.dependencies };
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean) as any[];

  // 1. Entry points (top 3-5 files with WHY each is important)
  const entryPoints = extractEntryPoints(scoredFiles, role, 3);

  // 2. Learning path (progressive understanding)
  const learningPath = buildLearningPath(scoredFiles, role);

  // 3. System flows (1-2 key flows for this role)
  const systemFlows = extractSystemFlows(scoredFiles, role, depGraph);

  // 4. Cross-role context
  const crossRoleContext = extractCrossRoleContext(role, rows, db);

  // 5. Role-specific tips
  const tips = generateRoleTips(role);

  // 6. Overview
  const overview = generateRoleOverview(role, scoredFiles.length);

  db.close();

  return {
    role,
    overview,
    entryPoints,
    learningPath,
    systemFlows,
    crossRoleContext,
    tips,
  };
}

/**
 * Extract 3-5 key entry points with specific reasons
 */
function extractEntryPoints(
  files: any[],
  role: string,
  limit: number = 3
): EntryPoint[] {
  const filtered = files
    .filter((f) => f.score >= 0.3)
    .slice(0, limit)
    .map((f, idx) => ({
      file: f.path,
      rank: idx + 1,
      why: generateEntryPointWhy(f.path, role, f.summary),
      relevance: Math.min(1, f.score),
    }));

  // If not enough, use supporting files
  if (filtered.length < limit) {
    const supporting = files
      .filter((f) => f.score < 0.3 && f.score >= 0.1)
      .slice(0, limit - filtered.length)
      .map((f, idx) => ({
        file: f.path,
        rank: filtered.length + idx + 1,
        why: generateEntryPointWhy(f.path, role, f.summary),
        relevance: f.score,
      }));
    return [...filtered, ...supporting];
  }

  return filtered;
}

/**
 * Generate specific reason for entry point
 */
function generateEntryPointWhy(file: string, role: string, summary: string): string {
  const fileName = file.split("/").pop() || file;

  if (file.includes("index") || file.includes("main")) {
    return `Main entry point for ${role} functionality`;
  }
  if (file.includes("controller") || file.includes("handler")) {
    return `Handles core ${role} request/logic flow`;
  }
  if (file.includes("component")) {
    return `Primary UI component for ${role} interface`;
  }
  if (file.includes("service")) {
    return `Core business logic and operations for ${role}`;
  }
  if (file.includes("config")) {
    return `Configuration that affects ${role} behavior`;
  }
  if (summary) {
    return summary.substring(0, 80);
  }
  return `Key file for ${role} operations`;
}

/**
 * Build learning path (step 1 -> step 2 -> step 3)
 */
function buildLearningPath(files: any[], role: string): LearningStep[] {
  const steps: LearningStep[] = [];

  // Step 1: Understand entry point
  if (files.length > 0) {
    steps.push({
      step: 1,
      description: "Understand the main entry point",
      files: [files[0].path],
      focus: `What does the ${role} module do? Look for main function, exports, or component.`,
    });
  }

  // Step 2: Explore dependencies
  if (files.length > 1) {
    const topDeps = files.slice(1, 3).map((f) => f.path);
    steps.push({
      step: 2,
      description: "Explore key dependencies",
      files: topDeps,
      focus: "How does the main file use these dependencies? Trace the data flow.",
    });
  }

  // Step 3: See downstream impact
  if (files.length > 3) {
    const downstreamFiles = files.slice(3, 5).map((f) => f.path);
    steps.push({
      step: 3,
      description: "See how other parts depend on you",
      files: downstreamFiles,
      focus: `Who calls this ${role} module? What do they expect from it?`,
    });
  }

  return steps;
}

/**
 * Extract 1-2 important system flows
 */
function extractSystemFlows(
  files: any[],
  role: string,
  _depGraph?: DependencyGraph
): SystemFlow[] {
  const flows: SystemFlow[] = [];

  if (files.length < 2) return flows;

  // Flow 1: Primary entry -> key dependency
  flows.push({
    name: `${role.charAt(0).toUpperCase() + role.slice(1)} Primary Flow`,
    description: "Core data/request flow through this role",
    flow: [files[0].path, files[1].path],
    explanation: generateFlowExplanation(files[0].path, files[1].path, role),
    confidence: 0.85,
  });

  // Flow 2: If enough files, show a longer flow
  if (files.length > 3) {
    flows.push({
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} Extended Flow`,
      description: "How the role connects to other systems",
      flow: [files[0].path, files[1].path, files[2].path],
      explanation: generateFlowExplanation(
        files[0].path,
        `${files[1].path} and ${files[2].path}`,
        role
      ),
      confidence: 0.7,
    });
  }

  return flows;
}

/**
 * Generate human-readable flow explanation
 */
function generateFlowExplanation(
  file1: string,
  file2: string,
  role: string
): string {
  const name1 = file1.split("/").pop();
  const name2 = file2.split("/").pop();

  if (role.includes("frontend")) {
    return `User interacts with ${name1} → triggers API call to backend via ${name2}`;
  }
  if (role.includes("backend")) {
    return `Request arrives at ${name1} → ${name2} processes and returns data`;
  }
  if (role.includes("devops")) {
    return `${name1} defines infrastructure → ${name2} handles deployment`;
  }

  return `${name1} initiates → ${name2} processes → result returned`;
}

/**
 * Extract what this role depends on and provides
 */
function extractCrossRoleContext(
  role: string,
  rows: any[],
  db: Database.Database
): CrossRoleContext {
  const context: CrossRoleContext = {
    role,
    dependsOn: [],
    provides: [],
  };

  // Simple heuristics based on role
  if (role === "frontend") {
    context.dependsOn = ["backend"];
    context.provides = ["user_interface"];
    context.keyAPIs = ["GET /api/*", "POST /api/*"];
  } else if (role === "backend") {
    context.dependsOn = ["data", "devops"];
    context.provides = ["api", "business_logic"];
    context.keyAPIs = ["REST endpoints"];
  } else if (role === "devops") {
    context.dependsOn = ["backend", "frontend"];
    context.provides = ["infrastructure", "deployment"];
  } else if (role === "data") {
    context.dependsOn = [];
    context.provides = ["database", "queries"];
  }

  return context;
}

/**
 * Generate role-specific tips
 */
function generateRoleTips(role: string): string[] {
  const tipsMap: Record<string, string[]> = {
    frontend: [
      "Start by understanding the UI component structure",
      "Check API hooks to see backend dependencies",
      "Look for global state management patterns",
    ],
    backend: [
      "Begin with route/controller definitions",
      "Trace the database schema for data models",
      "Check middleware for cross-cutting concerns",
    ],
    devops: [
      "Review Docker/K8s configs for infrastructure",
      "Check CI/CD pipelines for deployment process",
      "Understand environment-specific settings",
    ],
    data: [
      "Start with schema definitions",
      "Review ETL/pipeline logic",
      "Check query patterns and optimization",
    ],
    ai_ml: [
      "Start with model definitions",
      "Review training/inference pipelines",
      "Check data preprocessing steps",
    ],
    qa: [
      "Review test framework setup",
      "Check test organization and naming",
      "Look for common test patterns",
    ],
    security: [
      "Review authentication/authorization logic",
      "Check encryption implementations",
      "Understand secret management",
    ],
  };

  return tipsMap[role] || ["Read the documentation", "Ask your team lead"];
}

/**
 * Generate 1-2 sentence overview of what this role does
 */
function generateRoleOverview(role: string, fileCount: number): string {
  const overviewMap: Record<string, string> = {
    frontend: "Handles all user-facing interfaces and client-side logic.",
    backend: "Manages APIs, business logic, and data persistence.",
    full_stack: "Handles both frontend and backend across the application.",
    devops: "Manages infrastructure, deployment, and operational concerns.",
    ai_ml: "Implements machine learning models and inference pipelines.",
    data: "Handles databases, warehouses, and data pipelines.",
    qa: "Tests functionality, performance, and reliability.",
    security: "Ensures authentication, authorization, and data security.",
  };

  return (
    overviewMap[role] || `Handles ${role} concerns across the system.`
  );
}

/**
 * Fallback when no specific data available
 */
function getDefaultOnboarding(role: string): EnhancedOnboardView {
  return {
    role,
    overview: generateRoleOverview(role, 0),
    entryPoints: [],
    learningPath: [
      {
        step: 1,
        description: "Get repository overview",
        files: ["README.md", "package.json", "tsconfig.json"],
        focus: "Understand project structure and dependencies",
      },
    ],
    systemFlows: [],
    crossRoleContext: {
      role,
      dependsOn: [],
      provides: [],
    },
    tips: generateRoleTips(role),
  };
}

/**
 * Old simple onboarding for backward compatibility
 */
export interface OnboardFile {
  path: string;
  summary: string;
  deps: string[];
}

export interface OnboardView {
  role: string;
  primary: OnboardFile[];
  supporting: OnboardFile[];
  context: OnboardFile[];
  architect_info?: string;
}

export function generateOnboardingView(dbPath: string, role: string): OnboardView {
  const db = new Database(dbPath);

  // 1. Fetch files for this role, sorted by confidence descending
  const rows = db
    .prepare(
      `SELECT path, purpose as summary, dependencies, role_scores 
       FROM files 
       WHERE primary_role = ? 
       ORDER BY json_extract(role_scores, '$." + ${role} + "') DESC`
    )
    .all(role) as any[];

  const primary: OnboardFile[] = [];
  const supporting: OnboardFile[] = [];
  const context: OnboardFile[] = [];

  for (const row of rows) {
    let deps = [];
    try {
      deps = JSON.parse(row.dependencies || "[]");
      deps = deps.filter((d: string) => !/[\(\)\. ]/.test(d)).slice(0, 3);
    } catch (e) {
      deps = [];
    }

    const fileData = {
      path: row.path.replace(/\\/g, "/"),
      summary: row.summary || "No summary available.",
      deps: deps,
    };

    let score = 0;
    try {
      score = JSON.parse(row.role_scores || "{}")[role] || 0;
    } catch (e) {
      score = 0;
    }

    if (score >= 0.4) {
      primary.push(fileData);
    } else if (score >= 0.1) {
      supporting.push(fileData);
    } else {
      context.push(fileData);
    }
  }

  // DYNAMIC THRESHOLD: If no primary files found, drop the threshold until we have at least 3
  if (primary.length === 0) {
    const fallbackRows = db
      .prepare(
        `SELECT path, purpose as summary, dependencies, role_scores 
         FROM files 
         ORDER BY json_extract(role_scores, '$." + ${role} + "') DESC 
         LIMIT 3`
      )
      .all() as any[];
    for (const row of fallbackRows) {
      let deps = [];
      try {
        deps = JSON.parse(row.dependencies || "[]");
        deps = deps.filter((d: string) => !/[\(\)\. ]/.test(d)).slice(0, 3);
      } catch (e) {
        deps = [];
      }
      const fileData = {
        path: row.path.replace(/\\/g, "/"),
        summary: row.summary || "No summary available.",
        deps: deps,
      };
      supporting.push(fileData);
    }
  }

  db.close();

  return {
    role,
    primary: primary.slice(0, 3),
    supporting: supporting.slice(0, 5),
    context: context.slice(0, 3),
  };
}

/**
 * Print enhanced onboarding guide
 */
export function printEnhancedOnboardingCLI(view: EnhancedOnboardView): string {
  let output = "\n" + "═".repeat(70) + "\n";
  output += `🧭  ONBOARDING GUIDE: ${view.role.toUpperCase()} ENGINEER\n`;
  output += "═".repeat(70) + "\n\n";

  // Overview
  output += `📋 ${view.overview}\n\n`;

  // Entry points
  if (view.entryPoints.length > 0) {
    output += "🎯 START HERE (Key Entry Points)\n";
    output += "─".repeat(70) + "\n";
    view.entryPoints.forEach((ep) => {
      output += `  ${ep.rank}. ${ep.file} (${(ep.relevance * 100).toFixed(0)}%)\n`;
      output += `     ⟶ ${ep.why}\n\n`;
    });
  }

  // Learning path
  if (view.learningPath.length > 0) {
    output += "📚 LEARNING PATH (Step by Step)\n";
    output += "─".repeat(70) + "\n";
    view.learningPath.forEach((step) => {
      output += `  Step ${step.step}: ${step.description}\n`;
      output += `  Files: ${step.files.join(", ")}\n`;
      output += `  Focus: ${step.focus}\n\n`;
    });
  }

  // System flows
  if (view.systemFlows.length > 0) {
    output += "🔄 KEY SYSTEM FLOWS\n";
    output += "─".repeat(70) + "\n";
    view.systemFlows.forEach((flow) => {
      output += `  ${flow.name}\n`;
      output += `  Flow: ${flow.flow.join(" → ")}\n`;
      output += `  ${flow.explanation}\n\n`;
    });
  }

  // Cross-role context
  if (view.crossRoleContext.dependsOn.length > 0 || view.crossRoleContext.provides.length > 0) {
    output += "🔗 CROSS-ROLE CONNECTIONS\n";
    output += "─".repeat(70) + "\n";
    if (view.crossRoleContext.dependsOn.length > 0) {
      output += `  Depends on: ${view.crossRoleContext.dependsOn.join(", ")}\n`;
    }
    if (view.crossRoleContext.provides.length > 0) {
      output += `  Provides: ${view.crossRoleContext.provides.join(", ")}\n`;
    }
    output += "\n";
  }

  // Tips
  if (view.tips.length > 0) {
    output += "💡 TIPS FOR SUCCESS\n";
    output += "─".repeat(70) + "\n";
    view.tips.forEach((tip) => {
      output += `  • ${tip}\n`;
    });
  }

  output += "\n" + "═".repeat(70) + "\n";

  return output;
}

export function printOnboardingCLI(view: OnboardView): string {
  let output = "\n" + "=".repeat(60) + "\n";
  output += "🧭 ONBOARDING GUIDE: " + view.role.toUpperCase() + " ENGINEER\n";
  output += "=".repeat(60) + "\n\n";

  if (view.primary.length > 0) {
    output += "🎯 STEP 1: START HERE (Primary Files)\n" + "-".repeat(60) + "\n";
    view.primary.forEach((file, i) => {
      output += " " + (i + 1).toString().padEnd(4) + file.path + "\n";
      output += "    → " + file.summary + "\n";
      if (file.deps.length > 0) output += "    → Connects to: " + file.deps.join(", ") + "\n\n";
    });
  }

  if (view.supporting.length > 0) {
    output += "🛠️ STEP 2: EXPLORE DEPENDENCIES (Supporting Files)\n" + "-".repeat(60) + "\n";
    view.supporting.forEach((file) => {
      output += " • " + file.path + "\n    → " + file.summary + "\n\n";
    });
  }

  if (view.context.length > 0) {
    output += "📝 CONTEXT (Reference Only - Skip for now)\n" + "-".repeat(60) + "\n";
    view.context.forEach((file) => {
      output += " • " + file.path + "\n";
    });
  }

  return output;
}
