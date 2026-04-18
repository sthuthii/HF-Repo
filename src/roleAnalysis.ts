import "dotenv/config";

import fs from "fs";
import path from "path";
import db from "./db";
import {
  createSystem,
  Role,
  type RoleView,
  type MultiRoleView,
  type RepositoryOverview,
  type DataFlowResult,
  type FileDetails,
} from "./index";

interface FileContent {
  [filePath: string]: string;
}

/**
 * Initialize the role analysis system with files from the database
 */
export async function initializeRoleAnalysis(): Promise<void> {
  try {
    const files = db
      .prepare("SELECT path, raw_content FROM files")
      .all() as Array<{ path: string; raw_content: string }>;

    if (files.length === 0) {
      console.log("No files in database. Run 'npm run dev init <url>' first.");
      return;
    }

    const fileContents: FileContent = {};
    files.forEach((file) => {
      fileContents[file.path] = file.raw_content;
    });

    const system = createSystem();
    system.initializeRepository(fileContents);

    console.log(`✓ Analyzed ${files.length} files`);
  } catch (error) {
    console.error("Error initializing role analysis:", error);
    throw error;
  }
}

/**
 * Get role-specific analysis for a given role
 */
export async function getRoleAnalysis(roleName: string): Promise<RoleView> {
  const system = createSystem();
  const files = db
    .prepare("SELECT path, raw_content FROM files")
    .all() as Array<{ path: string; raw_content: string }>;

  if (files.length === 0) {
    throw new Error("No files in database");
  }

  const fileContents: FileContent = {};
  files.forEach((file) => {
    fileContents[file.path] = file.raw_content;
  });

  system.initializeRepository(fileContents);

  const role = roleName.toUpperCase().replace("-", "_") as Role;
  if (!Object.values(Role).includes(role)) {
    throw new Error(`Invalid role: ${roleName}. Valid roles: ${Object.values(Role).join(", ")}`);
  }

  return system.getRoleView(role);
}

/**
 * Get multi-role comparison analysis
 */
export async function getMultiRoleAnalysis(roleNames: string[]): Promise<MultiRoleView> {
  const system = createSystem();
  const files = db
    .prepare("SELECT path, raw_content FROM files")
    .all() as Array<{ path: string; raw_content: string }>;

  if (files.length === 0) {
    throw new Error("No files in database");
  }

  const fileContents: FileContent = {};
  files.forEach((file) => {
    fileContents[file.path] = file.raw_content;
  });

  system.initializeRepository(fileContents);

  const roles = roleNames.map((r) => {
    const role = r.toUpperCase().replace("-", "_") as Role;
    if (!Object.values(Role).includes(role)) {
      throw new Error(`Invalid role: ${r}. Valid roles: ${Object.values(Role).join(", ")}`);
    }
    return role;
  });

  return system.getMultiRoleView(roles);
}

/**
 * Trace data flow for a specific file
 */
export async function traceDataFlow(filePath: string): Promise<DataFlowResult> {
  const system = createSystem();
  const files = db
    .prepare("SELECT path, raw_content FROM files")
    .all() as Array<{ path: string; raw_content: string }>;

  if (files.length === 0) {
    throw new Error("No files in database");
  }

  const fileContents: FileContent = {};
  files.forEach((file) => {
    fileContents[file.path] = file.raw_content;
  });

  system.initializeRepository(fileContents);

  return system.traceFileFlow(filePath);
}

/**
 * Get detailed file information for a specific role
 */
export async function getFileRoleDetails(
  filePath: string,
  roleName: string
): Promise<FileDetails> {
  const system = createSystem();
  const files = db
    .prepare("SELECT path, raw_content FROM files")
    .all() as Array<{ path: string; raw_content: string }>;

  if (files.length === 0) {
    throw new Error("No files in database");
  }

  const fileContents: FileContent = {};
  files.forEach((file) => {
    fileContents[file.path] = file.raw_content;
  });

  system.initializeRepository(fileContents);

  const role = roleName.toUpperCase().replace("-", "_") as Role;
  if (!Object.values(Role).includes(role)) {
    throw new Error(`Invalid role: ${roleName}. Valid roles: ${Object.values(Role).join(", ")}`);
  }

  return system.getFileDetails(filePath, role);
}

/**
 * Get repository overview for a role
 */
export async function getRepositoryOverview(roleName: string): Promise<RepositoryOverview> {
  const system = createSystem();
  const files = db
    .prepare("SELECT path, raw_content FROM files")
    .all() as Array<{ path: string; raw_content: string }>;

  if (files.length === 0) {
    throw new Error("No files in database");
  }

  const fileContents: FileContent = {};
  files.forEach((file) => {
    fileContents[file.path] = file.raw_content;
  });

  system.initializeRepository(fileContents);

  const role = roleName.toUpperCase().replace("-", "_") as Role;
  if (!Object.values(Role).includes(role)) {
    throw new Error(`Invalid role: ${roleName}. Valid roles: ${Object.values(Role).join(", ")}`);
  }

  return system.getRepositoryOverview(role);
}

/**
 * Pretty print role view analysis
 */
export function printRoleView(view: RoleView): void {
  console.log(`\n📋 ${view.role?.toUpperCase()} VIEW\n`);

  console.log("🎯 PRIMARY FILES (Confidence > 0.7):");
  view.primary.forEach((file) => {
    console.log(`  ✓ ${file.path} (${(file.score * 100).toFixed(0)}%)`);
    if (file.explanation) console.log(`    → ${file.explanation}`);
  });

  console.log("\n📌 SUPPORTING FILES (0.4 - 0.7):");
  view.supporting.forEach((file) => {
    console.log(`  ○ ${file.path} (${(file.score * 100).toFixed(0)}%)`);
    if (file.explanation) console.log(`    → ${file.explanation}`);
  });

  console.log("\n📍 CONTEXT FILES (< 0.4):");
  view.context.slice(0, 5).forEach((file) => {
    console.log(`  · ${file.path} (${(file.score * 100).toFixed(0)}%)`);
  });

  if (view.context.length > 5) {
    console.log(`  ... and ${view.context.length - 5} more context files`);
  }

  console.log(`\n📊 Statistics: ${view.totalFiles} total files analyzed`);
}

/**
 * Pretty print repository overview
 */
export function printRepositoryOverview(overview: RepositoryOverview): void {
  console.log(`\n🗂️  REPOSITORY OVERVIEW - ${overview.role.toUpperCase()}\n`);

  console.log("📚 Key Files:");
  overview.keyFiles?.forEach((file, i) => {
    console.log(`  ${i + 1}. ${file.path}`);
  });

  console.log("\n🎓 Learning Path:");
  overview.learningPath?.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item}`);
  });

  console.log(`\n💡 Recommendations:`);
  overview.recommendations?.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });

  console.log(`\n📈 Coverage: ${((overview.coverage ?? 0) * 100).toFixed(1)}% of repository`);
}

/**
 * Pretty print file details
 */
export function printFileDetails(details: FileDetails): void {
  console.log(`\n📄 FILE DETAILS: ${details.path}\n`);

  console.log(`Role Confidence: ${((details.roleScore ?? 0) * 100).toFixed(0)}%`);
  console.log(`Primary Roles: ${(details.primaryRoles ?? []).join(", ")}`);
  console.log(`Supporting Roles: ${(details.supportingRoles ?? []).join(", ")}`);

  console.log(`\n📝 Explanation:`);
  console.log(`  ${details.explanation}`);

  console.log(`\n🔗 Dependencies (${details.dependencies.length}):`);
  details.dependencies.slice(0, 10).forEach((dep) => {
    console.log(`  → ${dep}`);
  });

  if (details.dependencies.length > 10) {
    console.log(`  ... and ${details.dependencies.length - 10} more`);
  }

  console.log(`\n← Dependents (${(details.dependents ?? []).length}):`);
  (details.dependents ?? []).slice(0, 10).forEach((dep) => {
    console.log(`  ← ${dep}`);
  });

  if ((details.dependents ?? []).length > 10) {
    console.log(`  ... and ${(details.dependents ?? []).length - 10} more`);
  }
}

/**
 * Pretty print data flow
 */
export function printDataFlow(flow: DataFlowResult): void {
  console.log(`\n🌊 DATA FLOW ANALYSIS: ${flow.sourceFile}\n`);

  console.log(`Found ${(flow.paths ?? []).length} potential flow path(s):\n`);

  (flow.paths ?? []).forEach((path, i) => {
    console.log(`Path ${i + 1} (Confidence: ${(path.confidence * 100).toFixed(0)}%):`);
    path.files.forEach((file, j) => {
      console.log(
        `  ${j + 1}. ${file} ${j < path.files.length - 1 ? "→" : ""}`
      );
    });
    console.log();
  });

  console.log(`Total files involved: ${flow.totalFilesInvolved}`);
}
