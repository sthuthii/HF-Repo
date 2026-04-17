"""
Configuration and constants for role-aware repository analysis.
"""
# RULES OVERRIDE:
# Auth-related files:
# - auth, jwt, token in filename OR path
# MUST increase:
# backend + security scores
# MUST decrease:
# frontend score

from enum import Enum
from typing import Dict, List, Set

# ============================================
# SUPPORTED ROLES
# ============================================

class Role(Enum):
    FRONTEND = "frontend"
    BACKEND = "backend"
    FULL_STACK = "full_stack"
    DEVOPS = "devops"
    AI_ML = "ai_ml"
    DATA = "data"
    QA = "qa"
    SECURITY = "security"


# ============================================
# ROLE-SPECIFIC PATH PATTERNS
# ============================================

ROLE_PATH_PATTERNS: Dict[Role, List[str]] = {
    Role.FRONTEND: [
        r"/(components|pages|screens|views|ui|frontend|client|web)",
        r"/(hooks|services|utils|styles|assets|public)",
        r"/\w+\.(tsx|jsx|css|scss|html)$",
    ],
    Role.BACKEND: [
        r"/(routes|controllers|services|models|api|server|backend)",
        r"/(middleware|auth|validators|handlers|utils)",
        r"/\w+\.(py|js|go|java|ts|rb)$",
    ],
    Role.DEVOPS: [
        r"/(config|infra|deploy|ci|cd|docker|k8s|ansible)",
        r"/(terraform|helm|scripts|monitoring|logging)",
        r"/\w+\.(yaml|yml|toml|json|sh|dockerfile)$",
    ],
    Role.AI_ML: [
        r"/(models|ml|ai|training|inference|notebooks|data)",
        r"/(pipelines|features|experiments)",
        r"/\w+\.(py|ipynb|pkl|h5)$",
    ],
    Role.DATA: [
        r"/(data|database|db|sql|migrations|seeds)",
        r"/(warehouse|etl|pipeline|analytics)",
        r"/\w+\.(sql|py|rb|scala)$",
    ],
    Role.QA: [
        r"/(tests|test|spec|__tests__|qa|quality)",
        r"/(fixtures|mocks|e2e|integration)",
        r"/\w+\.(test|spec)\.\w+$",
    ],
    Role.SECURITY: [
        r"/(security|auth|crypto|encryption|secrets|policies)",
        r"/(permissions|roles|oauth)",
        r"/\w+\.(pem|key|cert|policy)$",
    ],
}


# ============================================
# ROLE-SPECIFIC KEYWORDS
# ============================================

ROLE_KEYWORDS: Dict[Role, List[str]] = {
    Role.FRONTEND: [
        "component", "button", "modal", "form", "input", "render", "jsx", "tsx",
        "hook", "state", "dispatch", "redux", "context", "ui", "style", "css",
        "dom", "event", "handler", "click", "submit", "validation", "display",
    ],
    Role.BACKEND: [
        "route", "endpoint", "controller", "service", "middleware", "handler",
        "auth", "jwt", "session", "token", "request", "response", "database",
        "query", "model", "schema", "migration", "api", "rest", "graphql",
    ],
    Role.DEVOPS: [
        "deploy", "docker", "kubernetes", "terraform", "ansible", "ci", "cd",
        "pipeline", "build", "release", "environment", "infrastructure",
        "monitoring", "logging", "metrics", "alert", "container", "vm",
    ],
    Role.AI_ML: [
        "model", "training", "inference", "neural", "network", "layer",
        "optimizer", "loss", "accuracy", "dataset", "feature", "pipeline",
        "tensor", "torch", "tensorflow", "sklearn", "experiment",
    ],
    Role.DATA: [
        "database", "sql", "query", "table", "schema", "migration", "seed",
        "warehouse", "etl", "transform", "aggregate", "index", "backup",
        "data", "analytics", "report",
    ],
    Role.QA: [
        "test", "spec", "assert", "mock", "fixture", "suite", "case",
        "coverage", "e2e", "integration", "unit", "scenario", "validation",
    ],
    Role.SECURITY: [
        "auth", "encrypt", "decrypt", "permission", "role", "access",
        "security", "token", "jwt", "oauth", "certificate", "secret",
        "vulnerable", "risk", "policy",
    ],
}


# ============================================
# FILE TYPE PATTERNS
# ============================================

FILE_TYPE_ASSOCIATIONS: Dict[str, Set[Role]] = {
    # Frontend
    ".jsx": {Role.FRONTEND},
    ".tsx": {Role.FRONTEND},
    ".vue": {Role.FRONTEND},
    ".css": {Role.FRONTEND},
    ".scss": {Role.FRONTEND},
    ".html": {Role.FRONTEND},
    
    # Backend
    ".py": {Role.BACKEND, Role.AI_ML, Role.DATA},
    ".js": {Role.BACKEND, Role.FRONTEND},
    ".ts": {Role.BACKEND, Role.FRONTEND},
    ".go": {Role.BACKEND},
    ".java": {Role.BACKEND},
    ".rb": {Role.BACKEND},
    ".php": {Role.BACKEND},
    
    # DevOps
    ".yaml": {Role.DEVOPS},
    ".yml": {Role.DEVOPS},
    ".dockerfile": {Role.DEVOPS},
    ".tf": {Role.DEVOPS},
    ".sh": {Role.DEVOPS},
    ".json": {Role.DEVOPS, Role.BACKEND},
    
    # Data & Databases
    ".sql": {Role.DATA, Role.BACKEND},
    ".ipynb": {Role.AI_ML, Role.DATA},
    
    # Testing
    ".test.ts": {Role.QA},
    ".spec.ts": {Role.QA},
    ".test.js": {Role.QA},
    ".spec.js": {Role.QA},
}


# ============================================
# PRIORITY THRESHOLDS
# ============================================

PRIORITY_THRESHOLDS = {
    "primary": (0.7, 1.0),      # Must understand
    "supporting": (0.4, 0.69),  # Related logic
    "context": (0.1, 0.39),     # Additional context
    "hidden": (0.0, 0.09),      # Not shown by default
}


# ============================================
# DEPENDENCY DEPTH LIMITS
# ============================================

MAX_DEPENDENCY_DEPTH = 2  # 1-2 hop graph traversal
MAX_FILES_PER_PRIORITY = 50  # Limit results to avoid overwhelming UI


# ============================================
# ROLE DESCRIPTIONS
# ============================================

ROLE_DESCRIPTIONS = {
    Role.FRONTEND: "Frontend Developer - Focuses on UI components, styling, and user interactions",
    Role.BACKEND: "Backend Developer - Focuses on APIs, business logic, and data handling",
    Role.FULL_STACK: "Full Stack Developer - Balanced view of frontend and backend",
    Role.DEVOPS: "DevOps Engineer - Focuses on deployment, infrastructure, and CI/CD",
    Role.AI_ML: "AI/ML Engineer - Focuses on model training, inference, and ML pipelines",
    Role.DATA: "Data Engineer - Focuses on data pipelines, databases, and ETL",
    Role.QA: "QA/Test Engineer - Focuses on testing, automation, and quality assurance",
    Role.SECURITY: "Security Engineer - Focuses on authentication, encryption, and access control",
}
