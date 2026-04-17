"""
Main API for role-aware repository views.

Orchestrates role scoring, priority assignment, and explanation generation.
"""

from typing import Dict, List, Set, Optional
from dataclasses import asdict

from config import Role, ROLE_DESCRIPTIONS
from role_classifier import FileClassifier
from priority_engine import PriorityEngine, PrioritizedFile
from dependency_graph import DependencyGraph
from explanation_engine import ExplanationEngine


class RoleViewsSystem:
    """Main orchestrator for role-aware repository analysis."""
    
    def __init__(self):
        self.classifier = FileClassifier()
        self.dependency_graph = DependencyGraph()
        self.file_scores_cache: Dict[str, Dict[Role, float]] = {}
    
    # ============================================
    # CORE API
    # ============================================
    
    def initialize_repository(self, files: Dict[str, str]) -> Dict:
        """
        Initialize system with repository files.
        
        Args:
            files: {"file_path": "content"}
            
        Returns:
            {
                "status": "initialized",
                "total_files": 42,
                "analyzed_files": 42,
            }
        """
        
        # 1. Classify all files
        for file_path, content in files.items():
            classification = self.classifier.classify_file(file_path, content)
            self.file_scores_cache[file_path] = classification["scores"]
        
        # 2. Build dependency graph
        self.dependency_graph.build_graph(files)
        
        return {
            "status": "initialized",
            "total_files": len(files),
            "analyzed_files": len(self.file_scores_cache),
        }
    
    def get_role_view(
        self,
        role: Role,
        expand_context: bool = False,
    ) -> Dict[str, List[Dict]]:
        """
    CRITICAL REQUIREMENT:

    This function MUST return JSON-serializable output only.

    NO CLI formatting, NO print statements.

    Output schema:
    {
        "primary": [],
        "supporting": [],
        "context": []
    }

    This is consumed by a TypeScript frontend.
    """
        """
        Get prioritized view for a specific role.
        
        Args:
            role: The role to view
            expand_context: Show more context files
            
        Returns:
            {
                "primary": [
                    {
                        "file": "path/to/file.ts",
                        "score": 0.95,
                        "priority": "primary",
                        "roles": ["backend"],
                        "explanation": "Request handler - processes API requests",
                        "expandable": True,
                    },
                    ...
                ],
                "supporting": [...],
                "context": [...],
            }
        """
        
        # Convert scores to correct format
        file_scores = {
            file_path: {Role[k.upper()]: v for k, v in scores.items()}
            for file_path, scores in self.file_scores_cache.items()
        }
        
        # Get prioritized view
        view = PriorityEngine.create_role_view(
            role=role,
            file_scores=file_scores,
            dependencies=self.dependency_graph.imports,
        )
        
        # Add explanations and metadata
        result = {}
        for priority, files in view.items():
            result[priority] = []
            for pf in files:
                file_dict = pf.to_dict()
                
                # Add explanation
                file_dict["explanation"] = ExplanationEngine.explain_file_relevance(
                    file_path=pf.file_path,
                    role=role,
                    score=pf.score,
                    primary_role=pf.roles.pop().value if pf.roles else role.value,
                    reason=pf.reason,
                )
                
                # Check if file has dependencies
                file_dict["has_dependencies"] = bool(
                    self.dependency_graph.imports.get(pf.file_path, set())
                )
                file_dict["has_dependents"] = bool(
                    self.dependency_graph.imported_by.get(pf.file_path, set())
                )
                
                result[priority].append(file_dict)
        
        # Sort by score within each priority
        for priority in result:
            result[priority].sort(key=lambda x: x["score"], reverse=True)
        
        return result
    
    def get_multi_role_view(
        self,
        roles: List[Role],
        merge_strategy: str = "max",
    ) -> Dict[str, List[Dict]]:
        """
        Get merged view for multiple roles.
        
        Args:
            roles: List of roles to merge
            merge_strategy: "max", "average", or "weighted"
            
        Returns:
            Merged prioritized view
        """
        
        # Convert scores
        file_scores = {
            file_path: {Role[k.upper()]: v for k, v in scores.items()}
            for file_path, scores in self.file_scores_cache.items()
        }
        
        # Merge views
        view = PriorityEngine.merge_multi_role_view(
            roles=roles,
            file_scores=file_scores,
            dependencies=self.dependency_graph.imports,
            merge_strategy=merge_strategy,
        )
        
        # Add metadata
        result = {}
        for priority, files in view.items():
            result[priority] = []
            for pf in files:
                file_dict = pf.to_dict()
                file_dict["explanation"] = f"Relevant to: {', '.join([r.value for r in pf.roles])}"
                file_dict["has_dependencies"] = bool(
                    self.dependency_graph.imports.get(pf.file_path, set())
                )
                result[priority].append(file_dict)
        
        return result
    
    # ============================================
    # DATA FLOW TRACING
    # ============================================
    
    def trace_file_flow(
        self,
        start_file: str,
        end_file: Optional[str] = None,
    ) -> Dict:
        """
        Trace execution flow from one file through the dependency graph.
        
        Returns:
            {
                "start": "src/components/UserCard.tsx",
                "end": "src/models/User.ts" (if specified),
                "total_flows": 3,
                "flows": [
                    {
                        "path": ["component", "api", "controller", "model"],
                        "steps": [
                            "Component renders",
                            "Calls /api/users endpoint",
                            "Route handler processes",
                            "Queries User model"
                        ],
                        "confidence": 0.85,
                    }
                ]
            }
        """
        
        flow_result = self.dependency_graph.trace_data_flow(
            start_file=start_file,
            end_file=end_file,
            max_depth=5,
        )
        
        return {
            "start": start_file,
            "end": end_file,
            "total_flows": flow_result.get("total_flows", 0),
            "flows": flow_result.get("flows", []),
        }
    
    # ============================================
    # FILE-SPECIFIC OPERATIONS
    # ============================================
    
    def get_file_details(
        self,
        file_path: str,
        role: Role,
    ) -> Dict:
        """
        Get detailed information about a specific file for a role.
        
        Returns:
            {
                "file": "path/to/file.ts",
                "primary_role": "backend",
                "relevance": {
                    "frontend": 0.2,
                    "backend": 0.95,
                    ...
                },
                "priority": "primary",
                "explanation": "Request handler - processes API requests",
                "dependencies": ["service.ts", "model.ts"],
                "dependents": ["route.ts"],
                "summary": "Handles user authentication endpoints",
            }
        """
        
        scores = self.file_scores_cache.get(file_path, {})
        priority = PriorityEngine.assign_priority(scores.get(role.value, 0.0))
        
        return {
            "file": file_path,
            "primary_role": max(scores.items(), key=lambda x: x[1])[0] if scores else "unknown",
            "relevance": scores,
            "priority": priority,
            "explanation": ExplanationEngine.explain_file_relevance(
                file_path=file_path,
                role=role,
                score=scores.get(role.value, 0.0),
                primary_role=max(scores.items(), key=lambda x: x[1])[0] if scores else "unknown",
            ),
            "dependencies": list(self.dependency_graph.imports.get(file_path, set()))[:10],
            "dependents": list(self.dependency_graph.imported_by.get(file_path, set()))[:10],
            "dependency_depth": len(self.dependency_graph.get_dependencies(file_path)),
        }
    
    def expand_context_for_file(
        self,
        file_path: str,
        role: Role,
        expansion_type: str = "dependencies",
    ) -> Dict:
        """
        Expand context around a file for deeper exploration.
        
        Args:
            file_path: File to expand around
            role: Current role context
            expansion_type: "dependencies", "dependents", or "all"
            
        Returns:
            {
                "file": "path/to/file.ts",
                "related_files": [
                    {
                        "file": "dependency.ts",
                        "type": "dependency",
                        "depth": 1,
                        "relevance": 0.85,
                    }
                ]
            }
        """
        
        related = []
        
        if expansion_type in ["dependencies", "all"]:
            deps = self.dependency_graph.get_dependencies(file_path, max_depth=2)
            for depth, files in deps.items():
                for f in files:
                    score = self.file_scores_cache.get(f, {}).get(role.value, 0.0)
                    related.append({
                        "file": f,
                        "type": "dependency",
                        "depth": depth,
                        "relevance": score,
                    })
        
        if expansion_type in ["dependents", "all"]:
            dependents = self.dependency_graph.get_dependencies(
                file_path, max_depth=2, direction="backward"
            )
            for depth, files in dependents.items():
                for f in files:
                    score = self.file_scores_cache.get(f, {}).get(role.value, 0.0)
                    related.append({
                        "file": f,
                        "type": "dependent",
                        "depth": depth,
                        "relevance": score,
                    })
        
        # Sort by relevance
        related.sort(key=lambda x: x["relevance"], reverse=True)
        
        return {
            "file": file_path,
            "related_files": related[:20],
        }
    
    # ============================================
    # REPOSITORY OVERVIEW
    # ============================================
    
    def get_repository_overview(self, role: Role) -> Dict:
        """
        Get high-level overview of repository for a role.
        
        Returns:
            {
                "role": "backend",
                "description": "Backend Developer - Focuses on APIs, business logic, and data handling",
                "file_breakdown": {
                    "primary": 15,
                    "supporting": 25,
                    "context": 40,
                },
                "primary_focus": ["API routes", "Database models", "Business services"],
                "key_files": ["api/index.ts", "models/User.ts", "services/UserService.ts"],
                "main_dependencies": ["express", "sqlite3", "typescript"],
            }
        """
        
        file_scores = self.file_scores_cache
        
        # Count by priority
        breakdown = {"primary": 0, "supporting": 0, "context": 0}
        for file_path, scores in file_scores.items():
            score = scores.get(role.value, 0.0)
            priority = PriorityEngine.assign_priority(score)
            if priority in breakdown:
                breakdown[priority] += 1
        
        # Get top files for this role
        ranked_files = sorted(
            file_scores.items(),
            key=lambda x: x[1].get(role.value, 0.0),
            reverse=True
        )
        key_files = [f[0] for f in ranked_files[:5]]
        
        # Infer primary focus
        primary_focus = self._infer_primary_focus(role, key_files)
        
        # Generate detailed recommendation
        recommendation = self._generate_detailed_recommendation(
            role, key_files, breakdown
        )
        
        return {
            "role": role.value,
            "description": ROLE_DESCRIPTIONS.get(role, ""),
            "file_breakdown": breakdown,
            "total_files": len(file_scores),
            "primary_focus": primary_focus,
            "key_files": key_files,
            "recommendation": recommendation,
        }
    
    def _infer_primary_focus(self, role: Role, key_files: List[str]) -> List[str]:
        """Infer primary focus areas from key files."""
        
        focus_keywords = {
            Role.FRONTEND: ["components", "pages", "hooks", "styles"],
            Role.BACKEND: ["API routes", "controllers", "services", "models"],
            Role.DEVOPS: ["deployment", "infrastructure", "CI/CD", "monitoring"],
            Role.DATA: ["ETL", "data pipeline", "warehouse", "analytics"],
            Role.QA: ["tests", "automation", "quality", "coverage"],
            Role.SECURITY: ["authentication", "encryption", "access control", "validation"],
        }
        
        focus = focus_keywords.get(role, [])
        return focus[:3]
    
    def _generate_detailed_recommendation(self, role: Role, key_files: List[str], breakdown: Dict[str, int]) -> str:
        """Generate detailed, role-specific repository recommendations."""
        
        recommendation_templates = {
            Role.FRONTEND: {
                "workflow": "Start by exploring UI components and pages, then understand state management and hooks, finally review styling and layout patterns.",
                "focus": "Focus on understanding component hierarchy, prop flow, and user interaction patterns.",
                "context": "Supporting files provide CSS utilities, testing patterns, and third-party component integrations."
            },
            Role.BACKEND: {
                "workflow": "Begin with API route definitions and endpoints, then explore business logic in services, and review data models to understand schema design.",
                "focus": "Focus on request/response contracts, business logic flow, and database interactions.",
                "context": "Supporting files include middleware, authentication strategies, validation schemas, and database migrations."
            },
            Role.DEVOPS: {
                "workflow": "Start with deployment configuration and infrastructure code, then review CI/CD pipelines, and check environment configurations.",
                "focus": "Focus on deployment targets, resource definitions, and automation scripts.",
                "context": "Supporting files include Dockerfiles, helm charts, monitoring configs, and infrastructure-as-code templates."
            },
            Role.DATA: {
                "workflow": "Begin with ETL pipeline definitions and data schemas, explore transformation logic, then review analytics queries and data contracts.",
                "focus": "Focus on data flow, transformation logic, and schema documentation.",
                "context": "Supporting files include migration scripts, sample datasets, and data quality validation rules."
            },
            Role.QA: {
                "workflow": "Start with test structure and test cases, explore testing utilities and helpers, then review integration test scenarios.",
                "focus": "Focus on test coverage areas, testing strategies, and validation logic.",
                "context": "Supporting files include test fixtures, mock data, and automation frameworks."
            },
            Role.SECURITY: {
                "workflow": "Begin with authentication and authorization implementation, review access control rules, then audit input validation and encryption.",
                "focus": "Focus on security boundaries, threat vectors, and mitigation strategies.",
                "context": "Supporting files include security policies, audit logs, and vulnerability remediation guides."
            },
            Role.FULL_STACK: {
                "workflow": "Start with the full data flow from UI to database, then zoom into specific layers for detailed understanding.",
                "focus": "Focus on integration points between frontend and backend systems.",
                "context": "Supporting files include API contracts, shared types, and integration tests."
            },
            Role.AI_ML: {
                "workflow": "Begin with model architecture and training logic, explore feature engineering and data preprocessing, then review inference and evaluation.",
                "focus": "Focus on model design, training process, and performance metrics.",
                "context": "Supporting files include training scripts, hyperparameter configs, and model evaluation results."
            },
        }
        
        template = recommendation_templates.get(role, recommendation_templates.get(Role.FULL_STACK, recommendation_templates[Role.BACKEND]))
        
        primary_count = breakdown.get('primary', 0)
        supporting_count = breakdown.get('supporting', 0)
        context_count = breakdown.get('context', 0)
        
        recommendation_parts = []
        
        # Start with key files
        if key_files:
            recommendation_parts.append(f"Start with: {', '.join(key_files[:2])}")
        
        # Add workflow
        recommendation_parts.append(template['workflow'])
        
        # Add focus areas
        recommendation_parts.append(template['focus'])
        
        # Add file breakdown context
        breakdown_summary = f"You'll encounter {primary_count} core {role.value} files, {supporting_count} supporting files, and {context_count} context files."
        recommendation_parts.append(breakdown_summary)
        
        # Add supporting context
        recommendation_parts.append(template['context'])
        
        return " ".join(recommendation_parts)


# ============================================
# CONVENIENCE FUNCTIONS
# ============================================

def get_role_view(
    role: Role,
    file_scores: Dict[str, Dict[Role, float]],
    dependencies: Dict[str, Set[str]] = None,
) -> Dict[str, List[Dict]]:
    """
    Convenience function: get role view.
    
    Example:
        view = get_role_view(Role.BACKEND, file_scores)
        print(view["primary"])  # Most important backend files
    """
    engine = RoleViewsSystem()
    engine.file_scores_cache = {
        file_path: {k.value: v for k, v in scores.items()}
        for file_path, scores in file_scores.items()
    }
    if dependencies:
        engine.dependency_graph.imports = dependencies
    return engine.get_role_view(role)
