"""
Package initialization and main API exports.
"""

from config import Role, ROLE_DESCRIPTIONS
from role_classifier import FileClassifier, compute_role_scores
from priority_engine import PriorityEngine, assign_priority
from dependency_graph import DependencyGraph, trace_data_flow
from explanation_engine import ExplanationEngine, explain_file_relevance
from role_views import RoleViewsSystem, get_role_view
from prompts import PromptTemplates, CachedSummaryManager
from optimization import OptimizationStrategy, OptimizationProfiles
from examples import *
from ui_behavior import UIBehavior, UIStateMachine


__version__ = "1.0.0"
__author__ = "RepoMap Team"

__all__ = [
    # Core classes
    "Role",
    "FileClassifier",
    "PriorityEngine",
    "DependencyGraph",
    "ExplanationEngine",
    "RoleViewsSystem",
    "PromptTemplates",
    "CachedSummaryManager",
    "OptimizationStrategy",
    "OptimizationProfiles",
    "UIBehavior",
    "UIStateMachine",
    
    # Convenience functions
    "compute_role_scores",
    "assign_priority",
    "trace_data_flow",
    "explain_file_relevance",
    "get_role_view",
    
    # Constants
    "ROLE_DESCRIPTIONS",
]


def create_system() -> RoleViewsSystem:
    """
    Create a new role-aware views system instance.
    
    Usage:
        system = create_system()
        system.initialize_repository(files)
        view = system.get_role_view(Role.BACKEND)
    """
    return RoleViewsSystem()
