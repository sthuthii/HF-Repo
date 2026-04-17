"""
Comprehensive guide to the Role-Aware Intelligent Repository Views system.

This document covers:
1. Architecture overview
2. System design and data flow
3. Core concepts
4. Usage patterns
5. Integration guide
"""


# ============================================
# 1. ARCHITECTURE OVERVIEW
# ============================================

"""
HIGH-LEVEL ARCHITECTURE
=======================

                         ┌─────────────────────────┐
                         │  Source Code Repository │
                         └────────────┬────────────┘
                                      │
                                      ▼
                    ┌──────────────────────────────────┐
                    │   FILE CLASSIFICATION ENGINE     │
                    │  (role_classifier.py)            │
                    │                                  │
                    │  ✓ Path pattern matching         │
                    │  ✓ File type association         │
                    │  ✓ Keyword frequency analysis    │
                    │  ✓ Dependency-based scoring      │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────────────────────────┐
                    │  ROLE SCORES (0.0 - 1.0)         │
                    │  {"frontend": 0.6, ...}          │
                    └──────────────┬───────────────────┘
                                   │
        ┌─────────────────────────┬─────────────────────────┐
        ▼                         ▼                         ▼
  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
  │  PRIORITY ENGINE │   │ DEPENDENCY GRAPH │   │ EXPLANATION      │
  │(priority_engine) │   │(dependency_graph)│   │ENGINE            │
  │                  │   │                  │   │(explanation_engine)
  │ PRIMARY (0.7-1) │   │ • BFS/DFS        │   │                  │
  │ SUPPORTING      │   │ • Dep tracking   │   │ • Why shown      │
  │  (0.4-0.7)      │   │ • Data flow      │   │ • Role summary   │
  │ CONTEXT         │   │  tracing         │   │ • Confidence     │
  │  (0.1-0.4)      │   │                  │   │                  │
  └────────┬─────────┘   └──────────────────┘   └────────┬─────────┘
           │                                             │
           └──────────────────┬──────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  ROLE VIEW SYSTEM  │
                    │  (role_views.py)   │
                    │                    │
                    │  Frontend API:     │
                    │  • get_role_view() │
                    │  • trace_flow()    │
                    │  • file_details()  │
                    │  • expand_context()│
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │   UI/API RESPONSE  │
                    │                    │
                    │ {                  │
                    │  "primary": [...], │
                    │  "supporting":[..],│
                    │  "context": [...]  │
                    │ }                  │
                    └────────────────────┘


COMPONENT INTERACTION FLOW
==========================

1. Repository Initialization:
   Files → FileClassifier → Role Scores → Cache
   
2. Role View Request:
   Role → PriorityEngine → Bucketized Files → Explanations
   
3. Data Flow Tracing:
   Start File → DependencyGraph → Path Finding → Flow Explanation
   
4. Context Expansion:
   Current File → Dependency Traversal → Related Files → Display


CACHING LAYERS
==============

Layer 1: Role Scores Cache (.repomap/role_scores.json)
  - Precomputed per-file scores for all roles
  - Loaded on system start
  - Updated incrementally when files change

Layer 2: Summary Cache (.repomap/summaries.json)
  - Generic summaries cached
  - Adapted to each role (lightweight)
  - One summary per file

Layer 3: Dependency Graph Cache (.repomap/graph.json)
  - Precomputed import graph
  - Enables instant data flow tracing
  - Updated when imports change

Layer 4: In-Memory Cache (runtime)
  - FileClassifier.file_cache
  - Classification results
  - Cleared between sessions
"""


# ============================================
# 2. CORE CONCEPTS
# ============================================

"""
ROLE-BASED SCORING
==================

Each file receives a RELEVANCE SCORE per role (0.0 - 1.0):

  1.0 ├─ ┌──────────┐
      │  │ PRIMARY  │ Must understand
  0.7 ├─ ├──────────┤
      │  │SUPPORTING│ Related logic
  0.4 ├─ ├──────────┤
      │  │ CONTEXT  │ Additional context
  0.1 ├─ └──────────┘
  0.0 ├─ Hidden

Scoring Formula:
  score = 0.4 * path_score + 0.3 * type_score + 0.3 * keyword_score

Example:
  File: "src/components/UserCard.tsx"
  
  Frontend: 0.95  ← Matches /components/, .tsx type, "component" keyword
  Backend:  0.15  ← Doesn't match backend patterns
  QA:       0.40  ← Has "validation" in code
  

PRIORITY BUCKETS
================

PRIMARY (0.7-1.0):
  - Core files for the role
  - Must understand to work effectively
  - Example (Backend): API routes, models, services

SUPPORTING (0.4-0.7):
  - Related to primary files
  - Provides context and supporting logic
  - Example (Backend): Middleware, validators, utilities

CONTEXT (0.1-0.4):
  - Broader understanding
  - Can explore if interested
  - Example (Backend): Frontend components that use APIs


CROSS-ROLE INTELLIGENCE
=======================

Intelligently includes files from other roles:

Frontend Role:
  Primary: Components, pages, hooks, styles
  Supporting: API endpoints it calls
  Context: Backend controllers, database models

Backend Role:
  Primary: API routes, controllers, services, models
  Supporting: Middleware, validators
  Context: Frontend components that use APIs

DevOps Role:
  Primary: Infrastructure code, CI/CD pipelines
  Supporting: Service configurations
  Context: Application code it deploys

Data Role:
  Primary: ETL scripts, database schemas
  Supporting: Data pipeline code
  Context: Consumers of the data


DATA FLOW TRACING
=================

Traces execution flow through the codebase:

User selects: "src/components/UserCard.tsx"
System shows:
  
  Component → API → Controller → Service → Database
  
  Step 1: Component renders with useEffect
  Step 2: Calls /api/users endpoint
  Step 3: Route handler processes GET request
  Step 4: Service method performs business logic
  Step 5: Database query retrieves users

Score: Confidence level of the path (BFS-based)


EXPANDABLE CONTEXT
==================

Users can expand context to explore deeper:

Initial View: 15 files (primary)
  ↓ [Show More Backend Context]
  ↓
Expanded View: 15 + 25 files (primary + supporting)
  ↓ [Expand Dependencies]
  ↓
Full View: All related files (primary + supporting + context)


MULTI-ROLE MERGING
==================

When multiple roles selected:

Role 1 Score: {"file": 0.95}
Role 2 Score: {"file": 0.75}

Merge Strategy: "max"
Result: {"file": 0.95}

Merge Strategy: "average"
Result: {"file": 0.85}

Merge Strategy: "weighted"
Result: {"file": 0.90}  (accounts for relevance to each role)
"""


# ============================================
# 3. KEY FEATURES
# ============================================

"""
FEATURE 1: FILE ROLE SCORING SYSTEM
===================================

Scores files based on:
  • Path patterns (/components/, /routes/, /models/)
  • File types (.tsx, .py, .yaml)
  • Keywords (auth, api, ui, model)
  • Dependencies (imports, API usage)
  • Git signals (commit frequency, recency)

Score Factors:
  40% - Path pattern matching
  30% - File type association
  30% - Keyword frequency in content

Example Implementation:
  def classify_file(file_path, content):
      scores = {}
      # Path: 0.4 weight
      # Type: 0.3 weight
      # Keywords: 0.3 weight
      # Normalize and return


FEATURE 2: PRIORITY BUCKETING
=============================

Converts scores into actionable buckets:
  PRIMARY → "Must understand"
  SUPPORTING → "Related logic"
  CONTEXT → "Additional context"

Preserves all files (no filtering):
  - PRIMARY: Always shown
  - SUPPORTING: Show on demand
  - CONTEXT: Show when exploring


FEATURE 3: CROSS-ROLE INTELLIGENCE
==================================

Maps dependencies between roles:
  Frontend → Backend:
    - Show APIs that components call
    - Show backend models that APIs return
  
  Backend → Frontend:
    - Show frontend components that use APIs
    - Show API contracts
  
  DevOps → All:
    - Show infrastructure configs
    - Show deployment scripts


FEATURE 4: DATA FLOW TRACING
============================

Interactive execution flow visualization:
  Starting point: "UserList.tsx"
  
  Finds all paths to:
    - Backend APIs
    - Database queries
    - External services
  
  Ranks by confidence:
    - High: /api/users → controller → query
    - Low: Unlikely call chains


FEATURE 5: EXPLANATION ENGINE
=============================

Generates role-specific explanations:
  
  For Backend:
    "This is a request handler that processes API requests"
    "This entity model defines the User data structure"
  
  For Frontend:
    "This component renders the user profile UI"
    "This hook manages user data fetching"
  
  For DevOps:
    "This deployment config specifies container image"


FEATURE 6: ROLE-AWARE SUMMARIZATION
===================================

Tailored summaries for each role:
  
  Generic Summary: "Authenticates users with JWT tokens"
  
  For Backend:
    "Validates JWT tokens and extracts user claims"
  
  For QA:
    "Tests authentication with valid/invalid tokens"
  
  For Security:
    "Implements secure JWT validation with expiry"


FEATURE 7: MULTI-ROLE SUPPORT
=============================

Compare perspectives from multiple roles:
  
  Frontend + Backend View:
    - Shows component AND API endpoint
    - Shows how data flows between them
  
  DevOps + Backend View:
    - Shows service code AND deployment config
    - Shows infrastructure concerns


FEATURE 8: CUSTOM ROLE CREATION
==============================

Users can define custom roles:
  
  Mobile Developer:
    - Keywords: react-native, mobile, ios, android
    - Paths: /mobile/, /app/
    - Type: .native.ts, .rn.tsx
  
  System gets instant role view for custom role


FEATURE 9: PERFORMANCE OPTIMIZATION
===================================

Three optimization profiles:

  FAST: 10 LLM calls, cache all, heuristics only
  BALANCED: 50 LLM calls, selective LLM analysis
  ACCURATE: 200+ LLM calls, comprehensive analysis


FEATURE 10: CONFIDENCE SCORES
=============================

Each recommendation includes confidence:
  
  Flow Path 1: 92% likely (BFS-based scoring)
  Flow Path 2: 75% likely (alternative path)
  Flow Path 3: 45% likely (less confident)
"""


# ============================================
# 4. USAGE PATTERNS
# ============================================

"""
PATTERN 1: BASIC ROLE VIEW
=========================

from repomap_roles import create_system, Role

# Initialize
system = create_system()
system.initialize_repository(files)

# Get view for role
view = system.get_role_view(Role.BACKEND)

# view contains:
# {
#   "primary": [...],      # Must understand
#   "supporting": [...],   # Related
#   "context": [...]       # Extra context
# }


PATTERN 2: MULTI-ROLE COMPARISON
================================

roles = [Role.FRONTEND, Role.BACKEND]
view = system.get_multi_role_view(roles, merge_strategy="max")

# Merged view showing both perspectives


PATTERN 3: DATA FLOW TRACING
===========================

flows = system.trace_file_flow("src/components/UserCard.tsx")

# Returns:
# {
#   "flows": [
#     {
#       "path": ["component", "api", "controller", "model"],
#       "steps": ["Makes API call", "Route handler", "Database query"],
#       "confidence": 0.92
#     }
#   ]
# }


PATTERN 4: FILE EXPLORATION
===========================

details = system.get_file_details("src/api/controller.ts", Role.BACKEND)
# Returns: file info, relevance, dependencies, dependents

expanded = system.expand_context_for_file(
    "src/api/controller.ts",
    Role.BACKEND,
    expansion_type="dependencies"
)
# Shows related files for deeper exploration


PATTERN 5: REPOSITORY OVERVIEW
=============================

overview = system.get_repository_overview(Role.FRONTEND)

# Returns:
# {
#   "file_breakdown": {"primary": 15, "supporting": 30, "context": 50},
#   "key_files": [...],
#   "primary_focus": ["UI components", "Styling", "State management"]
# }


PATTERN 6: INCREMENTAL UPDATES
==============================

from repomap_roles.optimization import OptimizationStrategy

# Detect changes
changes = OptimizationStrategy.detect_changed_files(old_hashes, new_files)

# Update only changed files
scores = OptimizationStrategy.update_scores_incrementally(
    old_scores, changes, classifier
)


PATTERN 7: CACHING AND RETRIEVAL
===============================

# Save computed results
OptimizationStrategy.cache_role_scores(scores)
OptimizationStrategy.cache_dependency_graph(graph)
OptimizationStrategy.cache_summaries(summaries)

# Load on startup
scores = OptimizationStrategy.load_cached_scores()
"""


# ============================================
# 5. CONFIGURATION OPTIONS
# ============================================

"""
ENVIRONMENT VARIABLES
====================

REPOMAP_ROLES_CACHE_DIR = ".repomap"
  Directory for storing caches

REPOMAP_ROLES_MAX_LLM_CALLS = 50
  Maximum LLM calls per session

REPOMAP_ROLES_OPTIMIZATION = "BALANCED"
  Optimization profile: FAST | BALANCED | ACCURATE

REPOMAP_ROLES_DEPTH_LIMIT = 2
  Maximum dependency traversal depth


CONFIGURATION FILE (.repomap/config.json)
=========================================

{
  "optimization": "BALANCED",
  "max_llm_calls": 50,
  "cache_age_limit_hours": 12,
  "graph_depth_limit": 2,
  "custom_roles": [
    {
      "name": "Mobile Developer",
      "keywords": ["react-native", "ios"],
      "paths": ["/mobile/"]
    }
  ],
  "role_weights": {
    "frontend": 1.0,
    "backend": 1.0,
    "devops": 0.8
  }
}
"""


# ============================================
# 6. INTEGRATION GUIDE
# ============================================

"""
STEP 1: INSTALL DEPENDENCIES
============================

No external dependencies required!
Uses only Python stdlib for core functionality.

Optional (for enhanced features):
  - networkx (for advanced graph visualization)
  - pygments (for code syntax highlighting)


STEP 2: INITIALIZE SYSTEM
========================

from repomap_roles import create_system

system = create_system()

# Load all files from repository
files = load_repository_files()

# Initialize (precomputes and caches)
status = system.initialize_repository(files)
# {"status": "initialized", "total_files": 85, "analyzed_files": 85}


STEP 3: EXPOSE API ENDPOINTS
===========================

# FastAPI example
from fastapi import FastAPI

app = FastAPI()

@app.get("/api/roles/{role}")
def get_role_view(role: str):
    return system.get_role_view(role)

@app.get("/api/trace/{file_path}")
def trace_flow(file_path: str):
    return system.trace_file_flow(file_path)

@app.get("/api/files/{file_path}")
def get_file_details(file_path: str, role: str):
    return system.get_file_details(file_path, role)


STEP 4: BUILD UI WITH THE DATA
============================

See ui_behavior.py for complete UI specification:
  - Role selector
  - File list by priority
  - File details modal
  - Data flow tracer
  - Context expansion controls


STEP 5: DEPLOY AND MONITOR
=========================

Performance Metrics:
  - Track cache hit rate
  - Monitor LLM call count
  - Profile response times
  
Optimization:
  - Use FAST profile for instant feedback
  - Use ACCURATE for comprehensive analysis
  - Adjust based on performance metrics
"""


# ============================================
# 7. ADVANCED TOPICS
# ============================================

"""
CUSTOM ROLE DEFINITIONS
=======================

# Define custom role
custom_role = {
    "name": "Infrastructure Developer",
    "keywords": ["terraform", "kubernetes", "docker", "infrastructure"],
    "path_patterns": [
        r"/infrastructure/",
        r"/infra/",
        r"/(terraform|helm)/",
    ],
    "file_types": [".tf", ".yaml", ".yml", ".dockerfile"],
}

# Register with system
system.register_custom_role(custom_role)

# Use immediately
view = system.get_role_view("infrastructure_developer")


DEPENDENCY GRAPH ANALYSIS
=========================

# Get all files that depend on a file
dependents = system.dependency_graph.imported_by["src/models/User.ts"]

# Get all files this file depends on
dependencies = system.dependency_graph.imports["src/components/UserCard.tsx"]

# Find circular dependencies
circular = system.dependency_graph.find_circular_dependencies()


ADVANCED DATA FLOW ANALYSIS
==========================

# Find all paths between two files
paths = system.dependency_graph._find_all_paths(
    "src/components/UserCard.tsx",
    "src/database/User.ts",
    max_paths=10
)

# Analyze most critical paths
critical_paths = sorted(paths, key=lambda p: len(p))


LLM INTEGRATION
===============

from repomap_roles.prompts import PromptTemplates

# Generate summary prompt
prompt = PromptTemplates.summarize_file_for_role(content, "backend")
summary = llm.complete(prompt)

# Extract API contracts
prompt = PromptTemplates.identify_api_contracts(controller_content)
contracts = llm.complete(prompt)

# Use cached summaries with retrieval augmentation
manager = CachedSummaryManager()
base_summary = manager.get_summary(file_path)
tailored = PromptTemplates.reuse_cached_summary(base_summary, role)
"""


if __name__ == "__main__":
    print(__doc__)
