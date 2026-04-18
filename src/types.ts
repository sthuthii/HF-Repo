/**
 * Type definitions for role-aware repository analysis system.
 */

import { Role } from "./config";

/**
 * File classification result
 */
export interface FileClassificationResult {
  file: string;
  fileType: string;
  scores: Record<string, number>;
  primaryRole: string;
  confidence: number;
}

/**
 * Prioritized file with metadata
 */
export interface PrioritizedFile {
  filePath: string;
  score: number;
  priority: "primary" | "supporting" | "context" | "hidden";
  roles: Set<Role>;
  reason?: string;
  confidence?: number;
  explanation?: string;
  hasDependencies?: boolean;
  hasDependents?: boolean;
  path?: string; // Alias for compatibility

  toDict(): Record<string, any>;
}

/**
 * Role view with prioritized files
 */
export interface RoleView {
  role?: string;
  primary: PrioritizedFile[];
  supporting: PrioritizedFile[];
  context: PrioritizedFile[];
  totalFiles?: number;
}

/**
 * Multi-role view result
 */
export interface MultiRoleView {
  primary: Array<Record<string, any>>;
  supporting: Array<Record<string, any>>;
  context: Array<Record<string, any>>;
}

/**
 * Data flow path
 */
export interface DataFlowPath {
  files: string[];
  confidence: number;
}

/**
 * Data flow result
 */
export interface DataFlowResult {
  sourceFile?: string;
  totalFlows?: number;
  flows?: Array<{
    path: string[];
    steps: string[];
    confidence: number;
  }>;
  paths?: DataFlowPath[];
  totalFilesInvolved?: number;
}

/**
 * File details for a specific role
 */
export interface FileDetails {
  file?: string;
  path?: string;
  primaryRole?: string;
  primaryRoles?: string[];
  supportingRoles?: string[];
  priority?: string;
  explanation: string;
  roleScore?: number;
  dependencies: string[];
  dependents?: string[];
}

/**
 * Repository overview for a role
 */
export interface RepositoryOverview {
  role: string;
  description?: string;
  totalFiles?: number;
  primaryCount?: number;
  supportingCount?: number;
  contextCount?: number;
  recommendation?: string;
  keyFiles?: Array<{ path?: string }>;
  learningPath?: string[];
  recommendations?: string[];
  coverage?: number;
}

/**
 * Optimization strategy result
 */
export interface OptimizationResult {
  added: string[];
  modified: string[];
  deleted: string[];
  totalChanges: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  cacheHitRate: number;
  totalLLMCalls: number;
  timings: Record<string, { avgMs: number; minMs: number; maxMs: number; count: number }>;
}

/**
 * File with content
 */
export interface FileContent {
  [path: string]: string;
}

/**
 * Import/dependency information
 */
export interface DependencyInfo {
  imports: Record<string, Set<string>>;
  importedBy: Record<string, Set<string>>;
}
