/**
 * Configuration and constants for role-aware repository analysis.
 */
export declare enum Role {
    FRONTEND = "frontend",
    BACKEND = "backend",
    FULL_STACK = "full_stack",
    DEVOPS = "devops",
    AI_ML = "ai_ml",
    DATA = "data",
    QA = "qa",
    SECURITY = "security"
}
export type RoleValue = string & {
    readonly __brand: Role;
};
/**
 * ROLE-SPECIFIC PATH PATTERNS
 */
export declare const ROLE_PATH_PATTERNS: Record<Role, string[]>;
/**
 * ROLE-SPECIFIC KEYWORDS
 */
export declare const ROLE_KEYWORDS: Record<Role, string[]>;
/**
 * FILE TYPE PATTERNS
 */
export declare const FILE_TYPE_ASSOCIATIONS: Record<string, Set<Role>>;
/**
 * PRIORITY THRESHOLDS
 */
export declare const PRIORITY_THRESHOLDS: Record<string, [
    number,
    number
]>;
/**
 * DEPENDENCY DEPTH LIMITS
 */
export declare const MAX_DEPENDENCY_DEPTH = 2;
export declare const MAX_FILES_PER_PRIORITY = 50;
/**
 * ROLE DESCRIPTIONS
 */
export declare const ROLE_DESCRIPTIONS: Record<Role, string>;
//# sourceMappingURL=config.d.ts.map