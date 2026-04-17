"""
Priority assignment and bucketing engine.

Converts role scores into priority buckets:
- PRIMARY (0.7 – 1.0): Must understand
- SUPPORTING (0.4 – 0.7): Related logic
- CONTEXT (0.1 – 0.4): Additional context
"""

from typing import Dict, List, Set, Tuple
from dataclasses import dataclass

from config import Role, PRIORITY_THRESHOLDS, MAX_FILES_PER_PRIORITY


@dataclass
class PrioritizedFile:
    """Represents a file with priority and relevance metadata."""
    file_path: str
    score: float
    priority: str  # "primary", "supporting", "context"
    roles: Set[Role]
    reason: str = ""
    confidence: float = 1.0
    
    def to_dict(self) -> dict:
        return {
            "file": self.file_path,
            "score": self.score,
            "priority": self.priority,
            "roles": [r.value for r in self.roles],
            "reason": self.reason,
            "confidence": self.confidence,
        }


class PriorityEngine:
    """Assigns priority buckets to files based on role scores."""
    
    @staticmethod
    def assign_priority(score: float) -> str:
        """
        Assign priority bucket based on score.
        
        Args:
            score: Relevance score (0.0 - 1.0)
            
        Returns:
            "primary", "supporting", "context", or "hidden"
        """
        for priority_name, (min_val, max_val) in PRIORITY_THRESHOLDS.items():
            if min_val <= score <= max_val:
                return priority_name
        return "hidden"
    
    @staticmethod
    def create_role_view(
        role: Role,
        file_scores: Dict[str, Dict[Role, float]],
        dependencies: Dict[str, Set[str]] = None,
    ) -> Dict[str, List[PrioritizedFile]]:
        """
        Create a prioritized view for a specific role.
        
        Args:
            role: The role to create view for
            file_scores: {"file_path": {"role1": score1, ...}}
            dependencies: {"file_path": {"dependency1", "dependency2", ...}}
            
        Returns:
            {
                "primary": [PrioritizedFile, ...],
                "supporting": [PrioritizedFile, ...],
                "context": [PrioritizedFile, ...],
            }
        """
        view = {
            "primary": [],
            "supporting": [],
            "context": [],
        }
        
        # Track which files we've already added
        added = set()
        
        # 1. Score files directly for this role
        scored_files = []
        for file_path, scores in file_scores.items():
            score = scores.get(role, 0.0)
            if score > 0.0:
                priority = PriorityEngine.assign_priority(score)
                roles = {r for r, s in scores.items() if s > 0.3}
                scored_files.append((file_path, score, priority, roles))
        
        # 2. Add direct matches
        scored_files.sort(key=lambda x: x[1], reverse=True)
        for file_path, score, priority, roles in scored_files:
            # Skip hidden priority files (they're not shown by default)
            if priority == 'hidden':
                continue
            
            pf = PrioritizedFile(
                file_path=file_path,
                score=score,
                priority=priority,
                roles=roles,
            )
            view[priority].append(pf)
            added.add(file_path)
        
        # 3. Add cross-role context (dependencies)
        if dependencies:
            context_additions = PriorityEngine._get_cross_role_context(
                role, file_scores, dependencies, added
            )
            for pf in context_additions:
                # Skip hidden priority files
                if pf.priority == 'hidden':
                    continue
                view[pf.priority].append(pf)
                added.add(pf.file_path)
        
        # Limit results to avoid overwhelming UI
        for priority in view:
            view[priority] = view[priority][:MAX_FILES_PER_PRIORITY]
        
        return view
    
    @staticmethod
    def _get_cross_role_context(
        role: Role,
        file_scores: Dict[str, Dict[Role, float]],
        dependencies: Dict[str, Set[str]],
        already_added: Set[str],
    ) -> List[PrioritizedFile]:
        """
        Get files that should be shown as context due to dependencies.
        
        Example: If Backend role is selected, show Frontend files that call
        backend APIs as CONTEXT.
        """
        context_files = []
        
        # Cross-role patterns
        cross_role_context = {
            Role.FRONTEND: {
                Role.BACKEND: ("API calls", 0.35),  # Show backend APIs frontend uses
                Role.SECURITY: ("Auth concerns", 0.2),
            },
            Role.BACKEND: {
                Role.FRONTEND: ("UI usage", 0.25),  # Show frontend components
                Role.DATA: ("Data access", 0.5),
                Role.SECURITY: ("Auth/validation", 0.4),
            },
            Role.DEVOPS: {
                Role.BACKEND: ("Service deployment", 0.3),
                Role.FRONTEND: ("CDN/static hosting", 0.2),
            },
            Role.DATA: {
                Role.BACKEND: ("Data consumers", 0.4),
                Role.AI_ML: ("Pipeline input", 0.5),
            },
        }
        
        if role not in cross_role_context:
            return context_files
        
        target_roles = cross_role_context[role]
        
        for file_path, scores in file_scores.items():
            if file_path in already_added:
                continue
            
            for target_role, (reason, boost_score) in target_roles.items():
                if scores.get(target_role, 0.0) > 0.5:
                    priority = PriorityEngine.assign_priority(boost_score)
                    if priority in ["supporting", "context"]:
                        roles = {r for r, s in scores.items() if s > 0.3}
                        context_files.append(PrioritizedFile(
                            file_path=file_path,
                            score=boost_score,
                            priority=priority,
                            roles=roles,
                            reason=reason,
                        ))
        
        # Sort by score and deduplicate
        context_files.sort(key=lambda x: x.score, reverse=True)
        seen = {pf.file_path for pf in context_files}
        return [pf for pf in context_files if pf.file_path not in already_added]
    
    @staticmethod
    def merge_multi_role_view(
        roles: List[Role],
        file_scores: Dict[str, Dict[Role, float]],
        dependencies: Dict[str, Set[str]] = None,
        merge_strategy: str = "max",  # "max", "average", "weighted"
    ) -> Dict[str, List[PrioritizedFile]]:
        """
        Merge views from multiple roles.
        
        Args:
            roles: List of roles to merge
            file_scores: File scores by role
            dependencies: Dependency graph
            merge_strategy: How to combine scores
            
        Returns:
            Merged prioritized view
        """
        # Compute merged scores
        merged_scores = {}
        
        for file_path, scores in file_scores.items():
            role_scores = [scores.get(r, 0.0) for r in roles]
            
            if merge_strategy == "max":
                merged_score = max(role_scores)
            elif merge_strategy == "average":
                merged_score = sum(role_scores) / len(roles)
            elif merge_strategy == "weighted":
                # Weight by number of relevant roles
                merged_score = sum(role_scores) / len(roles) * (len([s for s in role_scores if s > 0]) / len(roles))
            else:
                merged_score = max(role_scores)
            
            merged_scores[file_path] = merged_score
        
        # Create view using merged scores
        view = {
            "primary": [],
            "supporting": [],
            "context": [],
        }
        
        scored_files = [
            (file_path, score)
            for file_path, score in merged_scores.items()
        ]
        scored_files.sort(key=lambda x: x[1], reverse=True)
        
        for file_path, score in scored_files:
            priority = PriorityEngine.assign_priority(score)
            # Skip hidden priority files
            if priority == 'hidden':
                continue
            
            relevant_roles = {r for r in roles if file_scores[file_path].get(r, 0.0) > 0.3}
            
            pf = PrioritizedFile(
                file_path=file_path,
                score=score,
                priority=priority,
                roles=relevant_roles,
            )
            view[priority].append(pf)
        
        # Limit results
        for priority in view:
            view[priority] = view[priority][:MAX_FILES_PER_PRIORITY]
        
        return view


def assign_priority(score: float) -> str:
    """
    Convenience function: assign priority based on score.
    
    Example:
        priority = assign_priority(0.85)  # "primary"
    """
    return PriorityEngine.assign_priority(score)
