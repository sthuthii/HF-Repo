/**
 * Priority assignment and bucketing engine.
 *
 * Converts role scores into priority buckets:
 * - PRIMARY (0.7 – 1.0): Must understand
 * - SUPPORTING (0.4 – 0.7): Related logic
 * - CONTEXT (0.1 – 0.4): Additional context
 * - HIDDEN (0.0 – 0.1): Not shown by default
 */
import { Role } from "./config";
import { PrioritizedFile, RoleView } from "./types";
export declare class PrioritizedFileImpl implements PrioritizedFile {
    filePath: string;
    score: number;
    priority: "primary" | "supporting" | "context" | "hidden";
    roles: Set<Role>;
    reason?: string;
    confidence?: number;
    explanation?: string;
    hasDependencies?: boolean;
    hasDependents?: boolean;
    constructor(filePath: string, score: number, priority: "primary" | "supporting" | "context" | "hidden", roles: Set<Role>);
    get path(): string;
    toDict(): Record<string, any>;
}
export declare class PriorityEngine {
    /**
     * Assign priority bucket based on score.
     */
    static assignPriority(score: number): "primary" | "supporting" | "context" | "hidden";
    /**
     * Create prioritized view for a specific role.
     */
    static createRoleView(role: Role, fileScores: Record<string, Record<Role, number>>, dependencies?: Record<string, Set<string>>): RoleView;
    /**
     * Merge views from multiple roles.
     */
    static mergeMultiRoleView(roles: Role[], fileScores: Record<string, Record<Role, number>>, dependencies?: Record<string, Set<string>>, mergeStrategy?: "max" | "average" | "weighted"): RoleView;
}
//# sourceMappingURL=priorityEngine.d.ts.map