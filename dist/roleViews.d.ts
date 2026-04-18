/**
 * Role-Aware Repository Views System
 *
 * Main system that orchestrates file classification, dependency analysis,
 * and role-specific view generation.
 */
import { Role } from "./config";
import { RoleView, MultiRoleView, DataFlowResult, FileDetails, RepositoryOverview } from "./types";
export declare class RoleViewsSystem {
    private classifier;
    private dependencyGraph;
    private fileScoresCache;
    constructor();
    /**
     * Initialize the system with a repository's files.
     */
    initializeRepository(files: Record<string, string>): void;
    /**
     * Get role-specific prioritized view of files.
     */
    getRoleView(role: Role): RoleView;
    /**
     * Get multi-role comparison view.
     */
    getMultiRoleView(roles: Role[], mergeStrategy?: "max" | "average" | "weighted"): MultiRoleView;
    /**
     * Trace data flow from a file.
     */
    traceFileFlow(startFile: string): DataFlowResult;
    /**
     * Get detailed information about a file for a specific role.
     */
    getFileDetails(filePath: string, role: Role): FileDetails;
    /**
     * Get repository overview for a role.
     */
    getRepositoryOverview(role: Role): RepositoryOverview;
    /**
     * Generate learning path for a role.
     */
    private generateLearningPath;
    /**
     * Generate recommendations for a role.
     */
    private generateRecommendations;
    /**
     * Clear all caches.
     */
    clear(): void;
}
/**
 * Factory function to create a system instance.
 */
export declare function createSystem(): RoleViewsSystem;
//# sourceMappingURL=roleViews.d.ts.map