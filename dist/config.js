"use strict";
/**
 * Configuration and constants for role-aware repository analysis.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_DESCRIPTIONS = exports.MAX_FILES_PER_PRIORITY = exports.MAX_DEPENDENCY_DEPTH = exports.PRIORITY_THRESHOLDS = exports.FILE_TYPE_ASSOCIATIONS = exports.ROLE_KEYWORDS = exports.ROLE_PATH_PATTERNS = exports.Role = void 0;
var Role;
(function (Role) {
    Role["FRONTEND"] = "frontend";
    Role["BACKEND"] = "backend";
    Role["FULL_STACK"] = "full_stack";
    Role["DEVOPS"] = "devops";
    Role["AI_ML"] = "ai_ml";
    Role["DATA"] = "data";
    Role["QA"] = "qa";
    Role["SECURITY"] = "security";
})(Role || (exports.Role = Role = {}));
/**
 * ROLE-SPECIFIC PATH PATTERNS
 */
exports.ROLE_PATH_PATTERNS = {
    [Role.FRONTEND]: [
        "/(components|pages|screens|views|ui|frontend|client|web)",
        "/(hooks|services|utils|styles|assets|public)",
        "/\\w+\\.(tsx|jsx|css|scss|html)$",
    ],
    [Role.BACKEND]: [
        "/(routes|controllers|services|models|api|server|backend)",
        "/(middleware|auth|validators|handlers|utils)",
        "/\\w+\\.(py|js|go|java|ts|rb)$",
    ],
    [Role.DEVOPS]: [
        "/(config|infra|deploy|ci|cd|docker|k8s|ansible)",
        "/(terraform|helm|scripts|monitoring|logging)",
        "/\\w+\\.(yaml|yml|toml|json|sh|dockerfile)$",
    ],
    [Role.AI_ML]: [
        "/(models|ml|ai|training|inference|notebooks|data)",
        "/(pipelines|features|experiments)",
        "/\\w+\\.(py|ipynb|pkl|h5)$",
    ],
    [Role.DATA]: [
        "/(data|database|db|sql|migrations|seeds)",
        "/(warehouse|etl|pipeline|analytics)",
        "/\\w+\\.(sql|py|rb|scala)$",
    ],
    [Role.QA]: [
        "/(tests|test|spec|__tests__|qa|quality|automation)",
        "/(fixtures|mocks|e2e|integration|functional|regression)",
        "/\\w+\\.(test|spec)\\.\\w+$",
        "/e2e/",
        "/integration/",
    ],
    [Role.SECURITY]: [
        "/(security|auth|crypto|encryption|secrets|policies|ssl|tls|jwt|oauth)",
        "/(permissions|roles|access|rbac|authentication|authorization)",
        "/\\w+\\.(pem|key|cert|policy|secure)$",
        "/auth/",
        "/security/",
    ],
    [Role.FULL_STACK]: [
        "/(src|app|lib|pages|views|routes|api|services|models|components|controllers|handlers)",
        "/(config|utils|helpers|middleware|hooks|store)",
        "/\\w+\\.(tsx?|jsx?|py|go|rb)$",
        "/pages/api/",
    ],
};
/**
 * ROLE-SPECIFIC KEYWORDS
 */
exports.ROLE_KEYWORDS = {
    [Role.FRONTEND]: [
        "component",
        "button",
        "modal",
        "form",
        "input",
        "render",
        "jsx",
        "tsx",
        "hook",
        "state",
        "dispatch",
        "redux",
        "context",
        "ui",
        "style",
        "css",
        "dom",
        "event",
        "handler",
        "click",
        "submit",
        "validation",
        "display",
    ],
    [Role.BACKEND]: [
        "route",
        "endpoint",
        "controller",
        "service",
        "middleware",
        "handler",
        "auth",
        "jwt",
        "session",
        "token",
        "request",
        "response",
        "database",
        "query",
        "model",
        "schema",
        "migration",
        "api",
        "rest",
        "graphql",
    ],
    [Role.DEVOPS]: [
        "deploy",
        "docker",
        "kubernetes",
        "terraform",
        "ansible",
        "ci",
        "cd",
        "pipeline",
        "build",
        "release",
        "environment",
        "infrastructure",
        "monitoring",
        "logging",
        "metrics",
        "alert",
        "container",
        "vm",
    ],
    [Role.AI_ML]: [
        "model",
        "training",
        "inference",
        "neural",
        "network",
        "layer",
        "optimizer",
        "loss",
        "accuracy",
        "dataset",
        "feature",
        "pipeline",
        "tensor",
        "torch",
        "tensorflow",
        "sklearn",
        "experiment",
    ],
    [Role.DATA]: [
        "database",
        "sql",
        "query",
        "table",
        "schema",
        "migration",
        "seed",
        "warehouse",
        "etl",
        "transform",
        "aggregate",
        "index",
        "backup",
        "data",
        "analytics",
        "report",
    ],
    [Role.QA]: [
        "test",
        "spec",
        "assert",
        "mock",
        "fixture",
        "suite",
        "case",
        "coverage",
        "e2e",
        "integration",
        "unit",
        "scenario",
        "validation",
        "describe",
        "it",
        "expect",
        "beforeeach",
        "aftereach",
        "playwright",
        "jest",
        "mocha",
        "cypress",
    ],
    [Role.SECURITY]: [
        "auth",
        "encrypt",
        "decrypt",
        "permission",
        "role",
        "access",
        "security",
        "token",
        "jwt",
        "oauth",
        "certificate",
        "secret",
        "vulnerable",
        "risk",
        "policy",
        "bcrypt",
        "hash",
        "verify",
        "grant",
        "deny",
        "ssl",
        "tls",
        "cipher",
    ],
    [Role.FULL_STACK]: [
        "component",
        "controller",
        "service",
        "route",
        "model",
        "api",
        "handler",
        "util",
        "helper",
        "middleware",
        "config",
    ],
};
/**
 * FILE TYPE PATTERNS
 */
exports.FILE_TYPE_ASSOCIATIONS = {
    // Frontend
    ".jsx": new Set([Role.FRONTEND]),
    ".tsx": new Set([Role.FRONTEND]),
    ".vue": new Set([Role.FRONTEND]),
    ".css": new Set([Role.FRONTEND]),
    ".scss": new Set([Role.FRONTEND]),
    ".html": new Set([Role.FRONTEND]),
    // Backend
    ".py": new Set([Role.BACKEND, Role.AI_ML, Role.DATA]),
    ".js": new Set([Role.BACKEND, Role.FRONTEND]),
    ".ts": new Set([Role.BACKEND, Role.FRONTEND]),
    ".go": new Set([Role.BACKEND]),
    ".java": new Set([Role.BACKEND]),
    ".rb": new Set([Role.BACKEND]),
    ".php": new Set([Role.BACKEND]),
    // DevOps
    ".yaml": new Set([Role.DEVOPS]),
    ".yml": new Set([Role.DEVOPS]),
    ".dockerfile": new Set([Role.DEVOPS]),
    ".tf": new Set([Role.DEVOPS]),
    ".sh": new Set([Role.DEVOPS]),
    ".json": new Set([Role.DEVOPS, Role.BACKEND]),
    // Data & Databases
    ".sql": new Set([Role.DATA, Role.BACKEND]),
    ".ipynb": new Set([Role.AI_ML, Role.DATA]),
    // Testing
    ".test.ts": new Set([Role.QA]),
    ".spec.ts": new Set([Role.QA]),
    ".test.js": new Set([Role.QA]),
    ".spec.js": new Set([Role.QA]),
};
/**
 * PRIORITY THRESHOLDS
 */
exports.PRIORITY_THRESHOLDS = {
    primary: [0.7, 1.0], // Must understand
    supporting: [0.4, 0.69], // Related logic
    context: [0.1, 0.39], // Additional context
    hidden: [0.0, 0.09], // Not shown by default
};
/**
 * DEPENDENCY DEPTH LIMITS
 */
exports.MAX_DEPENDENCY_DEPTH = 2; // 1-2 hop graph traversal
exports.MAX_FILES_PER_PRIORITY = 50; // Limit results to avoid overwhelming UI
/**
 * ROLE DESCRIPTIONS
 */
exports.ROLE_DESCRIPTIONS = {
    [Role.FRONTEND]: "Frontend Developer - Focuses on UI components, styling, and user interactions",
    [Role.BACKEND]: "Backend Developer - Focuses on APIs, business logic, and data handling",
    [Role.FULL_STACK]: "Full Stack Developer - Balanced view of frontend and backend",
    [Role.DEVOPS]: "DevOps Engineer - Focuses on deployment, infrastructure, and CI/CD",
    [Role.AI_ML]: "AI/ML Engineer - Focuses on model training, inference, and ML pipelines",
    [Role.DATA]: "Data Engineer - Focuses on data pipelines, databases, and ETL",
    [Role.QA]: "QA/Test Engineer - Focuses on testing, automation, and quality assurance",
    [Role.SECURITY]: "Security Engineer - Focuses on authentication, encryption, and access control",
};
//# sourceMappingURL=config.js.map