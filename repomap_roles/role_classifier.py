"""

# CRITICAL FIX:
# Dockerfile, docker-compose.yml, Jenkinsfile MUST always have:
# - devops score >= 0.90
# - priority = PRIMARY
# Override ALL ML/heuristic scoring below
File classification and role scoring system.

Assigns relevance scores to files based on:
- Path patterns
- File type
- Content keywords
- Dependency relationships
"""

import os
import re
from typing import Dict, Set, Tuple, List
from pathlib import Path
from collections import Counter

from config import (
    Role, ROLE_PATH_PATTERNS, ROLE_KEYWORDS, FILE_TYPE_ASSOCIATIONS,
    PRIORITY_THRESHOLDS
)


class FileClassifier:
    """Classifies files and computes role relevance scores."""
    
    def __init__(self):
        self.compiled_patterns = self._compile_patterns()
        self.file_cache = {}
        # Infrastructure files that MUST be classified as devops with >0.90 confidence
        self.infrastructure_files = {
            r'^dockerfile$': 'devops',
            r'^docker-compose\.ya?ml$': 'devops',
            r'^docker-compose\.override\.ya?ml$': 'devops',
            r'^jenkinsfile$': 'devops',
            r'^makefile$': 'devops',
            r'^gradlew$': 'devops',
        }
    
    def _compile_patterns(self) -> Dict[Role, List[re.Pattern]]:
        """Pre-compile regex patterns for performance."""
        compiled = {}
        for role, patterns in ROLE_PATH_PATTERNS.items():
            compiled[role] = [re.compile(p, re.IGNORECASE) for p in patterns]
        return compiled
    
    # ============================================
    # CORE CLASSIFICATION FUNCTIONS
    # ============================================
    
    def classify_file(self, file_path: str, content: str = "") -> Dict[str, any]:
        """
        Classify a single file and compute role scores.
        
        Args:
            file_path: Relative path to file
            content: File content for keyword analysis
            
        Returns:
            {
                "file": "path/to/file.ts",
                "file_type": ".ts",
                "scores": {"frontend": 0.6, "backend": 0.95, ...},
                "primary_role": "backend",
                "confidence": 0.95,
            }
        """
        
        # Check cache
        if file_path in self.file_cache:
            return self.file_cache[file_path]
        
        # Get file extension
        file_ext = Path(file_path).suffix.lower()
        
        # Initialize scores for all roles
        scores = {role.value: 0.0 for role in Role}
        
        # CRITICAL: Check infrastructure files FIRST (before weighted scoring)
        # These files get special handling and bypass normal scoring
        infrastructure_override = self._check_infrastructure_file(file_path)
        
        if infrastructure_override:
            scores = infrastructure_override
        else:
            # 1. Path pattern matching (40% weight)
            path_scores = self._score_by_path(file_path)
            for role, score in path_scores.items():
                scores[role] += score * 0.40
            
            # 2. File type association (30% weight)
            type_scores = self._score_by_type(file_ext)
            for role, score in type_scores.items():
                scores[role] += score * 0.30
            
            # 3. Content keyword analysis (30% weight)
            if content:
                keyword_scores = self._score_by_keywords(content)
                for role, score in keyword_scores.items():
                    scores[role] += score * 0.30
            
            # 4. Special adjustments for specific file types
            scores = self._apply_special_adjustments(file_path, content, scores)
        
        # Normalize scores to 0-1 range (skip if infrastructure override)
        if not infrastructure_override:
            scores = self._normalize_scores(scores)
        
        # Determine primary role
        primary_role = max(scores.items(), key=lambda x: x[1])[0]
        confidence = scores[primary_role]
        
        result = {
            "file": file_path,
            "file_type": file_ext,
            "scores": scores,
            "primary_role": primary_role,
            "confidence": confidence,
        }
        
        self.file_cache[file_path] = result
        return result
    
    # ============================================
    # INFRASTRUCTURE FILE DETECTION
    # ============================================
    
    def _check_infrastructure_file(self, file_path: str) -> Dict[str, float]:
        """
        Check if file is a known infrastructure file and return high devops score.
        These files bypass normal scoring and get >0.90 devops confidence.
        
        Returns:
            Dict with high devops score if infrastructure file, else empty dict
        """
        file_name = Path(file_path).name.lower()
        
        for pattern, role_boost in self.infrastructure_files.items():
            if re.match(pattern, file_name):
                # Return full scores dict with 0.0 for all roles except the matched one
                scores = {role.value: 0.0 for role in Role}
                scores[role_boost] = 0.95
                return scores
        
        return {}
    
    # ============================================
    # SCORING STRATEGIES
    # ============================================
    
    def _score_by_path(self, file_path: str) -> Dict[str, float]:
        """Score file based on path patterns."""
        scores = {}
        
        for role, patterns in self.compiled_patterns.items():
            max_score = 0.0
            for pattern in patterns:
                if pattern.search(file_path):
                    max_score = 1.0
                    break
            scores[role.value] = max_score
        
        return scores
    
    def _score_by_type(self, file_ext: str) -> Dict[str, float]:
        """Score file based on extension associations."""
        scores = {role.value: 0.0 for role in Role}
        
        if file_ext in FILE_TYPE_ASSOCIATIONS:
            for role in FILE_TYPE_ASSOCIATIONS[file_ext]:
                scores[role.value] = 1.0
        
        return scores
    
    def _score_by_keywords(self, content: str) -> Dict[str, float]:
        """Score file based on keyword frequency in content."""
        scores = {role.value: 0.0 for role in Role}
        
        # Normalize content for matching
        content_lower = content.lower()
        content_words = re.findall(r'\b\w+\b', content_lower)
        word_freq = Counter(content_words)
        
        for role, keywords in ROLE_KEYWORDS.items():
            keyword_matches = sum(word_freq.get(kw, 0) for kw in keywords)
            # Score: min(matches / 10, 1.0)
            scores[role.value] = min(keyword_matches / 10.0, 1.0)
        
        return scores
    
    def _apply_special_adjustments(self, file_path: str, content: str, scores: Dict[str, float]) -> Dict[str, float]:
        """
        Apply special adjustments for specific file types and patterns.
        
        Args:
            file_path: Path to the file
            content: File content
            scores: Current scores dict
            
        Returns:
            Adjusted scores dict
        """
        adjusted = scores.copy()
        file_lower = file_path.lower()
        content_lower = content.lower() if content else ""
        
        # Auth-related files: boost security and backend, penalize frontend
        auth_keywords = {"auth", "jwt", "token", "oauth", "permission", "access", "security"}
        file_has_auth = any(kw in file_lower for kw in auth_keywords)
        content_has_auth = any(kw in content_lower for kw in auth_keywords) if content else False
        
        if file_has_auth or content_has_auth:
            # Boost security and backend roles
            adjusted['security'] = min(adjusted['security'] + 0.35, 1.0)
            adjusted['backend'] = min(adjusted['backend'] + 0.25, 1.0)
            
            # Penalize frontend (auth is not typically a frontend concern)
            adjusted['frontend'] = max(adjusted['frontend'] - 0.20, 0.0)
        
        return adjusted
    
    def _normalize_scores(self, scores: Dict[str, float]) -> Dict[str, float]:
        """
        Normalize scores to 0-1 range with intelligent scaling.
        
        Avoids lazy default scores - files that don't match a role should get
        very low scores (below 0.1), not default middle-ground values.
        """
        total = sum(scores.values())
        
        # If no scores at all, file is completely neutral/irrelevant
        if total == 0:
            # Instead of 0.5 neutral, use lower baseline scores
            # This ensures files without clear relevance don't appear
            return {role: 0.05 for role in scores}  # Minimal scores instead of 0.5
        
        # Normalize by the total
        normalized = {}
        for role, score in scores.items():
            # Scale based on proportion of total
            normalized[role] = (score / total)
        
        return normalized
    
    # ============================================
    # BATCH PROCESSING
    # ============================================
    
    def classify_files_batch(self, files: Dict[str, str]) -> List[Dict]:
        """
        Classify multiple files efficiently.
        
        Args:
            files: {"file_path": "content"}
            
        Returns:
            List of classification results
        """
        results = []
        for file_path, content in files.items():
            results.append(self.classify_file(file_path, content))
        return results
    
    def get_role_association(self, file_path: str) -> Set[Role]:
        """Get set of roles this file is relevant to."""
        classification = self.classify_file(file_path)
        scores = classification["scores"]
        
        # Roles with score > 0.3 are considered relevant
        return {
            Role[k.upper().replace("-", "_")]
            for k, v in scores.items()
            if v > 0.3
        }


def compute_role_scores(file_path: str, content: str = "") -> Dict[Role, float]:
    """
    Convenience function: compute role scores for a file.
    
    Example:
        scores = compute_role_scores("api/userController.js")
        # Returns: {"frontend": 0.6, "backend": 0.95, ...}
    """
    classifier = FileClassifier()
    result = classifier.classify_file(file_path, content)
    
    # Convert string keys back to Role enums
    return {
        Role[k.upper()]: v
        for k, v in result["scores"].items()
    }
