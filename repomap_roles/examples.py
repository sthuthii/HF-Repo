"""
Example inputs and outputs for role-aware repository analysis.

Shows how the system works with realistic data.
"""

# ============================================
# EXAMPLE 1: FILE CLASSIFICATION
# ============================================

EXAMPLE_CLASSIFY_FILE = {
    "input": {
        "file_path": "src/api/userController.ts",
        "content": """
import { Request, Response } from 'express';
import { User } from '../models/User';
import { AuthService } from '../services/AuthService';

export class UserController {
    async getUserById(req: Request, res: Response) {
        const userId = req.params.id;
        const user = await User.findById(userId);
        res.json({ success: true, data: user });
    }
    
    async createUser(req: Request, res: Response) {
        const { email, password } = req.body;
        const user = await User.create({ email, password });
        res.json({ success: true, data: user });
    }
}
"""
    },
    "output": {
        "file": "src/api/userController.ts",
        "file_type": ".ts",
        "scores": {
            "frontend": 0.15,
            "backend": 0.95,
            "full_stack": 0.70,
            "devops": 0.10,
            "ai_ml": 0.05,
            "data": 0.20,
            "qa": 0.30,
            "security": 0.50,
        },
        "primary_role": "backend",
        "confidence": 0.95,
    }
}


# ============================================
# EXAMPLE 2: ROLE-BASED PRIORITIZATION
# ============================================

EXAMPLE_ROLE_VIEW = {
    "input": {
        "role": "backend",
        "selected_files": [
            "src/api/userController.ts",
            "src/models/User.ts",
            "src/services/AuthService.ts",
            "src/components/UserCard.tsx",
            "src/middleware/auth.ts",
            "src/config/database.ts",
        ]
    },
    "output": {
        "primary": [
            {
                "file": "src/api/userController.ts",
                "score": 0.95,
                "priority": "primary",
                "roles": ["backend"],
                "reason": "Core API endpoint",
                "explanation": "Request handler - processes API requests for user data",
            },
            {
                "file": "src/models/User.ts",
                "score": 0.90,
                "priority": "primary",
                "roles": ["backend", "data"],
                "reason": "Entity definition",
                "explanation": "Data model - defines User entity structure and validation",
            },
            {
                "file": "src/services/AuthService.ts",
                "score": 0.85,
                "priority": "primary",
                "roles": ["backend", "security"],
                "reason": "Core service",
                "explanation": "Business logic - handles authentication and authorization",
            },
        ],
        "supporting": [
            {
                "file": "src/middleware/auth.ts",
                "score": 0.65,
                "priority": "supporting",
                "roles": ["backend", "security"],
                "reason": "Auth concerns",
                "explanation": "Middleware - validates requests and enforces permissions",
            },
            {
                "file": "src/config/database.ts",
                "score": 0.55,
                "priority": "supporting",
                "roles": ["backend"],
                "reason": "Configuration",
                "explanation": "Setup file - configures database connection pool",
            },
        ],
        "context": [
            {
                "file": "src/components/UserCard.tsx",
                "score": 0.25,
                "priority": "context",
                "roles": ["frontend"],
                "reason": "UI usage",
                "explanation": "Frontend component - shows how user data is rendered",
            },
        ]
    }
}


# ============================================
# EXAMPLE 3: MULTI-ROLE MERGING
# ============================================

EXAMPLE_MULTI_ROLE = {
    "input": {
        "roles": ["frontend", "backend"],
        "merge_strategy": "max",
    },
    "output": {
        "primary": [
            {
                "file": "src/api/userController.ts",
                "score": 0.95,
                "priority": "primary",
                "roles": ["backend"],
                "explanation": "Relevant to: backend",
            },
            {
                "file": "src/components/UserCard.tsx",
                "score": 0.92,
                "priority": "primary",
                "roles": ["frontend"],
                "explanation": "Relevant to: frontend",
            },
        ],
        "supporting": [
            {
                "file": "src/models/User.ts",
                "score": 0.90,
                "priority": "primary",
                "roles": ["backend", "frontend"],
                "explanation": "Relevant to: backend, frontend (shared types)",
            },
        ]
    }
}


# ============================================
# EXAMPLE 4: DATA FLOW TRACING
# ============================================

EXAMPLE_DATA_FLOW = {
    "input": {
        "start_file": "src/components/UserList.tsx",
        "end_file": None,  # Show common paths
    },
    "output": {
        "start": "src/components/UserList.tsx",
        "end": None,
        "flows": [
            {
                "path": [
                    "src/components/UserList.tsx",
                    "src/api/index.ts",
                    "src/api/userController.ts",
                    "src/models/User.ts",
                ],
                "steps": [
                    "Component renders with useEffect",
                    "Calls /api/users endpoint",
                    "Route handler processes GET request",
                    "Database query retrieves users",
                ],
                "confidence": 0.92,
            },
            {
                "path": [
                    "src/components/UserList.tsx",
                    "src/services/UserService.ts",
                    "src/api/userController.ts",
                ],
                "steps": [
                    "Component calls service method",
                    "Service prepares data",
                    "Controller returns response",
                ],
                "confidence": 0.75,
            }
        ]
    }
}


# ============================================
# EXAMPLE 5: FILE DETAILS & EXPANSION
# ============================================

EXAMPLE_FILE_DETAILS = {
    "input": {
        "file_path": "src/components/UserCard.tsx",
        "role": "frontend",
    },
    "output": {
        "file": "src/components/UserCard.tsx",
        "primary_role": "frontend",
        "relevance": {
            "frontend": 0.98,
            "backend": 0.15,
            "full_stack": 0.70,
            "devops": 0.05,
            "qa": 0.40,
        },
        "priority": "primary",
        "explanation": "Core frontend component - renders UI for user profile display",
        "dependencies": [
            "src/api/index.ts",
            "src/hooks/useUser.ts",
            "src/styles/card.css",
        ],
        "dependents": [
            "src/pages/UserProfile.tsx",
            "src/components/UserList.tsx",
        ],
        "summary": "React component displaying user information card with name, email, and avatar. Fetches data via hook and supports click events for user interactions.",
    }
}


# ============================================
# EXAMPLE 6: CONTEXT EXPANSION
# ============================================

EXAMPLE_EXPAND_CONTEXT = {
    "input": {
        "file_path": "src/api/userController.ts",
        "role": "backend",
        "expansion_type": "dependencies",
    },
    "output": {
        "file": "src/api/userController.ts",
        "related_files": [
            {
                "file": "src/models/User.ts",
                "type": "dependency",
                "depth": 1,
                "relevance": 0.90,
            },
            {
                "file": "src/services/AuthService.ts",
                "type": "dependency",
                "depth": 1,
                "relevance": 0.85,
            },
            {
                "file": "src/database/User.ts",
                "type": "dependency",
                "depth": 2,
                "relevance": 0.75,
            },
            {
                "file": "src/types/User.ts",
                "type": "dependency",
                "depth": 2,
                "relevance": 0.60,
            },
        ]
    }
}


# ============================================
# EXAMPLE 7: REPOSITORY OVERVIEW
# ============================================

EXAMPLE_REPO_OVERVIEW = {
    "input": {
        "role": "backend",
    },
    "output": {
        "role": "backend",
        "description": "Backend Developer - Focuses on APIs, business logic, and data handling",
        "file_breakdown": {
            "primary": 15,
            "supporting": 28,
            "context": 42,
        },
        "total_files": 85,
        "primary_focus": [
            "API routes and endpoints",
            "Database models and queries",
            "Business service logic",
        ],
        "key_files": [
            "src/api/routes.ts",
            "src/models/User.ts",
            "src/services/UserService.ts",
            "src/api/userController.ts",
            "src/middleware/auth.ts",
        ],
        "recommendation": "Start with src/api/routes.ts to understand the backend perspective. This is the main API entry point that orchestrates all endpoint handlers.",
    }
}


# ============================================
# EXAMPLE 8: SCORE BREAKDOWN
# ============================================

EXAMPLE_SCORE_BREAKDOWN = {
    "input": {
        "file_path": "src/components/UserForm.tsx",
    },
    "output": {
        "file": "src/components/UserForm.tsx",
        "scores": {
            "frontend": 0.95,
            "backend": 0.15,
            "full_stack": 0.70,
            "devops": 0.05,
            "ai_ml": 0.00,
            "data": 0.10,
            "qa": 0.50,
            "security": 0.25,
        },
        "score_factors": {
            "path_pattern": {
                "frontend": 1.0,  # Matches /components/
                "backend": 0.0,
            },
            "file_type": {
                "frontend": 1.0,  # .tsx extension
                "backend": 0.2,   # Some TS/JS backend files
            },
            "keywords": {
                "frontend": 1.0,  # "component", "form", "input", "button"
                "backend": 0.1,
                "qa": 0.6,        # "validation", "error handling"
            }
        },
        "scoring_explanation": "Highest score for frontend (0.95) due to /components path and .tsx extension. Secondary relevance to QA (0.50) due to form validation logic.",
    }
}


# ============================================
# EXAMPLE 9: CUSTOM ROLE
# ============================================

EXAMPLE_CUSTOM_ROLE = {
    "input": {
        "role_name": "Mobile Developer",
        "description": "Focuses on cross-platform mobile app development",
        "keywords": ["react-native", "mobile", "app", "ios", "android"],
        "path_patterns": [
            r"/mobile/",
            r"/(app|native)/",
            r"\.(rn|native)\.(ts|tsx|js)$",
        ],
    },
    "output": {
        "role_id": "custom_mobile",
        "created": True,
        "description": "Custom role created: Mobile Developer",
        "initial_files": [
            "src/mobile/screens/HomeScreen.tsx",
            "src/mobile/components/Button.tsx",
            "src/app/config.ts",
        ]
    }
}


# ============================================
# EXAMPLE 10: PROMPT TEMPLATE
# ============================================

EXAMPLE_PROMPT_TEMPLATE = {
    "input": {
        "template_type": "summarize_for_role",
        "role": "backend",
        "file_content": """
async function getUserById(req: Request, res: Response) {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, data: user });
}
"""
    },
    "output": {
        "prompt": """Summarize this code for a backend engineer in 2-3 sentences.

Focus on API endpoints, business logic, database queries, validation

Code:
```
async function getUserById(req: Request, res: Response) {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, data: user });
}
```

Summary:"""
    }
}


if __name__ == "__main__":
    import json
    print("Example 1: File Classification")
    print(json.dumps(EXAMPLE_CLASSIFY_FILE, indent=2))
    print("\n" + "="*50 + "\n")
    
    print("Example 2: Role View")
    print(json.dumps(EXAMPLE_ROLE_VIEW, indent=2))
