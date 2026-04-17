"""
Dependency graph analysis and data flow tracing.

Enables cross-file exploration and execution flow tracing.
"""

import re
from typing import Dict, Set, List, Tuple, Optional
from collections import defaultdict, deque

from config import Role


class DependencyGraph:
    """Analyzes file dependencies and traces data flow."""
    
    def __init__(self):
        # Adjacency list: file_path -> set of imported files
        self.imports: Dict[str, Set[str]] = defaultdict(set)
        # Reverse: file_path -> set of files that import it
        self.imported_by: Dict[str, Set[str]] = defaultdict(set)
        # File content cache for analysis
        self.content_cache: Dict[str, str] = {}
    
    # ============================================
    # IMPORT EXTRACTION
    # ============================================
    
    def extract_imports(self, file_path: str, content: str) -> Set[str]:
        """
        Extract imports from file content.
        Supports: JS/TS, Python, Go, Java
        
        Args:
            file_path: Path to file
            content: File content
            
        Returns:
            Set of imported file paths (relative)
        """
        imports = set()
        file_ext = file_path.split('.')[-1].lower()
        
        if file_ext in ['ts', 'tsx', 'js', 'jsx']:
            imports.update(self._extract_js_imports(content))
        elif file_ext in ['py']:
            imports.update(self._extract_python_imports(content))
        elif file_ext in ['go']:
            imports.update(self._extract_go_imports(content))
        elif file_ext in ['java']:
            imports.update(self._extract_java_imports(content))
        
        return imports
    
    def _extract_js_imports(self, content: str) -> Set[str]:
        """Extract JavaScript/TypeScript imports."""
        imports = set()
        
        # ES6 imports: import x from 'path'
        pattern1 = r"import\s+.*?from\s+['\"]([^'\"]+)['\"]"
        # CommonJS requires: require('path')
        pattern2 = r"require\s*\(\s*['\"]([^'\"]+)['\"]\s*\)"
        # Dynamic imports: import('path')
        pattern3 = r"(?:import|from)\s+['\"]([^'\"]+)['\"]"
        
        imports.update(re.findall(pattern1, content))
        imports.update(re.findall(pattern2, content))
        imports.update(re.findall(pattern3, content))
        
        return imports
    
    def _extract_python_imports(self, content: str) -> Set[str]:
        """Extract Python imports."""
        imports = set()
        
        # from x import y
        pattern1 = r"from\s+([a-zA-Z0-9_.]+)\s+import"
        # import x
        pattern2 = r"import\s+([a-zA-Z0-9_.]+)"
        
        imports.update(re.findall(pattern1, content))
        imports.update(re.findall(pattern2, content))
        
        return imports
    
    def _extract_go_imports(self, content: str) -> Set[str]:
        """Extract Go imports."""
        imports = set()
        pattern = r'import\s+["\']([^"\']+)["\']'
        imports.update(re.findall(pattern, content))
        return imports
    
    def _extract_java_imports(self, content: str) -> Set[str]:
        """Extract Java imports."""
        imports = set()
        pattern = r'import\s+([a-zA-Z0-9_.]+);'
        imports.update(re.findall(pattern, content))
        return imports
    
    # ============================================
    # GRAPH BUILDING
    # ============================================
    
    def build_graph(self, files: Dict[str, str]) -> None:
        """
        Build dependency graph from files.
        
        Args:
            files: {"file_path": "content"}
        """
        for file_path, content in files.items():
            self.content_cache[file_path] = content
            imports = self.extract_imports(file_path, content)
            
            for imported in imports:
                # Normalize import path
                normalized = self._normalize_import(imported, file_path)
                if normalized:
                    self.imports[file_path].add(normalized)
                    self.imported_by[normalized].add(file_path)
    
    def _normalize_import(self, import_path: str, from_file: str) -> Optional[str]:
        """
        Normalize import path to relative file path.
        
        Example:
            from_file: "src/api/controller.ts"
            import_path: "./service" or "../utils/helper"
            returns: "src/utils/helper.ts" or "src/api/service.ts"
        """
        # Remove .js/.ts/.py extensions
        import_path = re.sub(r'\.(js|ts|py|tsx|jsx)$', '', import_path)
        
        # Handle relative imports
        if import_path.startswith('.'):
            base_dir = '/'.join(from_file.split('/')[:-1])
            
            # Resolve ../ references
            while import_path.startswith('../'):
                base_dir = '/'.join(base_dir.split('/')[:-1])
                import_path = import_path[3:]
            
            # Resolve ./ references
            import_path = import_path.lstrip('./')
            normalized = f"{base_dir}/{import_path}"
        else:
            # Absolute import (from root)
            normalized = import_path
        
        # Guess extension
        for ext in ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java']:
            if f"{normalized}{ext}" in self.content_cache or f"{normalized}/index{ext}" in self.content_cache:
                return f"{normalized}{ext}"
        
        # Default guess
        return f"{normalized}.ts" if not normalized.endswith(('.ts', '.py', '.js')) else normalized
    
    # ============================================
    # TRAVERSAL: BFS/DFS
    # ============================================
    
    def get_dependencies(
        self,
        file_path: str,
        max_depth: int = 2,
        direction: str = "forward"
    ) -> Dict[int, Set[str]]:
        """
        Get all dependencies of a file (transitive closure).
        
        Args:
            file_path: Starting file
            max_depth: Max recursion depth
            direction: "forward" (imports) or "backward" (imported_by)
            
        Returns:
            {depth: {files at that depth}}
        """
        graph = self.imports if direction == "forward" else self.imported_by
        
        result = defaultdict(set)
        visited = {file_path}
        queue = deque([(file_path, 0)])
        
        while queue:
            current, depth = queue.popleft()
            
            if depth >= max_depth:
                continue
            
            for neighbor in graph.get(current, set()):
                if neighbor not in visited:
                    visited.add(neighbor)
                    result[depth + 1].add(neighbor)
                    queue.append((neighbor, depth + 1))
        
        return dict(result)
    
    # ============================================
    # DATA FLOW TRACING (CRITICAL FEATURE)
    # ============================================
    
    def trace_data_flow(
        self,
        start_file: str,
        end_file: Optional[str] = None,
        max_depth: int = 5,
    ) -> Dict:
        """
        Trace data flow from a start file through dependencies.
        
        This is a CRITICAL feature that must work reliably:
        1. Uses actual dependency graph when available
        2. Falls back to pattern-based inference when graph is incomplete
        3. NEVER returns empty results
        
        Args:
            start_file: Starting file (e.g., "src/components/UserCard.tsx")
            end_file: Optional target file to trace to
            max_depth: Maximum traversal depth
            
        Returns:
            {
                "total_flows": 3,
                "flows": [
                    {
                        "path": ["src/components/UserCard.tsx", "src/api/index.ts", "src/api/userController.ts"],
                        "steps": ["Component renders", "Calls API", "Controller handles request"],
                        "confidence": 0.85
                    },
                    ...
                ]
            }
        """
        flows = []
        
        # 1. Try graph-based tracing first
        flows.extend(self._find_common_flows(start_file, max_depth))
        
        # 2. If no flows found or too few, use pattern-based inference
        if len(flows) < 2:
            inferred_flows = self._infer_flows_from_patterns(start_file, max_depth)
            flows.extend(inferred_flows)
        
        # 3. Ensure we always return at least one flow (even if synthetic)
        if not flows:
            fallback_flow = self._generate_fallback_flow(start_file)
            flows.append(fallback_flow)
        
        # Sort by confidence
        flows.sort(key=lambda x: x.get("confidence", 0.5), reverse=True)
        
        return {
            "total_flows": len(flows),
            "flows": flows[:5],  # Return top 5 flows
        }
    
    def _find_common_flows(
        self,
        start_file: str,
        max_depth: int
    ) -> List[Dict]:
        """
        Find execution flows using actual dependency graph.
        Uses DFS to explore import paths.
        """
        paths = []
        visited_paths = set()
        
        def dfs(current: str, path: List[str], depth: int):
            if depth == 0 or len(path) > 8:
                return
            
            # Check if start file exists in imports
            if current in self.imports:
                for neighbor in self.imports.get(current, set()):
                    new_path = path + [neighbor]
                    path_tuple = tuple(new_path)
                    
                    if path_tuple not in visited_paths and len(visited_paths) < 100:
                        visited_paths.add(path_tuple)
                        
                        # Score this path
                        score = self._score_flow_path(new_path)
                        if score > 0.4:  # Lower threshold to find more flows
                            steps = self._annotate_flow_steps(new_path)
                            paths.append({
                                "path": new_path,
                                "steps": steps,
                                "confidence": score,
                            })
                        
                        dfs(neighbor, new_path, depth - 1)
        
        if start_file in self.imports or start_file in self.imported_by:
            dfs(start_file, [start_file], max_depth)
        
        return paths
    
    def _infer_flows_from_patterns(
        self,
        start_file: str,
        max_depth: int
    ) -> List[Dict]:
        """
        Generate flows based on common patterns when actual graph is incomplete.
        
        Pattern chains (e.g., for frontend):
        component → hooks → api → controller → service → model
        """
        flows = []
        file_name_lower = start_file.lower()
        
        # Determine file type of start_file
        if "component" in file_name_lower or "page" in file_name_lower:
            # Frontend component - infer backend chain
            patterns = [
                {
                    "path_pattern": ["component", "hook", "api", "controller", "service"],
                    "confidence": 0.75,
                },
                {
                    "path_pattern": ["component", "api", "service", "model"],
                    "confidence": 0.70,
                },
                {
                    "path_pattern": ["component", "hook", "service", "middleware"],
                    "confidence": 0.65,
                },
            ]
        elif "service" in file_name_lower:
            # Backend service
            patterns = [
                {
                    "path_pattern": ["service", "model"],
                    "confidence": 0.80,
                },
                {
                    "path_pattern": ["service", "controller", "handler"],
                    "confidence": 0.75,
                },
            ]
        elif "controller" in file_name_lower or "handler" in file_name_lower:
            # Backend controller
            patterns = [
                {
                    "path_pattern": ["controller", "service", "model"],
                    "confidence": 0.80,
                },
            ]
        else:
            return flows
        
        # Generate flows for each pattern
        for pattern_info in patterns:
            pattern = pattern_info["path_pattern"]
            
            # Look for files matching the pattern
            inferred_path = [start_file]
            for file_type in pattern[1:]:
                # Find a file matching this type in the repository
                matching_file = self._find_file_by_type(file_type)
                if matching_file:
                    inferred_path.append(matching_file)
            
            if len(inferred_path) > 1:
                steps = self._annotate_flow_steps(inferred_path)
                flows.append({
                    "path": inferred_path,
                    "steps": steps,
                    "confidence": pattern_info["confidence"],
                })
        
        return flows
    
    def _find_file_by_type(self, file_type: str) -> Optional[str]:
        """Find a file matching the given type from known files."""
        for file_path in self.content_cache.keys():
            if file_type in file_path.lower():
                return file_path
        return None
    
    def _generate_fallback_flow(self, start_file: str) -> Dict:
        """Generate a synthetic flow when nothing else works."""
        return {
            "path": [start_file],
            "steps": [f"Start: {start_file}"],
            "confidence": 0.3,
        }
    
    def _score_flow_path(self, path: List[str]) -> float:
        """Score how likely a flow path is based on file type sequences."""
        score = 0.5  # Base score
        
        # Boost for certain file types in sequence
        patterns = [
            (r"(component|page|hook)", r"(api|service)"),
            (r"(api|route)", r"(controller|handler)"),
            (r"(controller|handler)", r"(service)"),
            (r"(service)", r"(model|db|database)"),
            (r"(hook)", r"(api)"),
        ]
        
        for i in range(len(path) - 1):
            current_file = path[i]
            next_file = path[i + 1]
            
            for curr_pattern, next_pattern in patterns:
                if re.search(curr_pattern, current_file, re.IGNORECASE) and \
                   re.search(next_pattern, next_file, re.IGNORECASE):
                    score += 0.2
        
        return min(score, 1.0)
    
    def _annotate_flow_steps(self, path: List[str]) -> List[str]:
        """
        Annotate flow steps with human-readable descriptions.
        
        Example:
            ["src/components/UserCard.tsx", "src/hooks/useUser.ts", "src/api/index.ts"]
            →
            ["Component renders", "Calls custom hook", "Makes API request"]
        """
        steps = []
        
        for i, file_path in enumerate(path):
            file_lower = file_path.lower()
            
            if i == 0:
                # First file
                if "component" in file_lower:
                    steps.append("Component renders")
                elif "page" in file_lower:
                    steps.append("Page initializes")
                elif "hook" in file_lower:
                    steps.append("Hook executes")
                elif "service" in file_lower:
                    steps.append("Service method called")
                elif "controller" in file_lower or "handler" in file_lower:
                    steps.append("Handler processes request")
                else:
                    steps.append(f"Start: {file_path.split('/')[-1]}")
            else:
                prev_file = path[i - 1].lower()
                
                # Infer step based on file type transitions
                if ("component" in prev_file or "page" in prev_file or "hook" in prev_file) and "api" in file_lower:
                    steps.append("Makes API call")
                elif ("component" in prev_file or "hook" in prev_file) and "service" in file_lower:
                    steps.append("Calls service method")
                elif "api" in prev_file and ("controller" in file_lower or "handler" in file_lower):
                    steps.append("Route handler processes")
                elif "api" in prev_file and "index" in file_lower:
                    steps.append("Routes to endpoint")
                elif ("controller" in prev_file or "handler" in prev_file) and "service" in file_lower:
                    steps.append("Calls service logic")
                elif "service" in prev_file and ("model" in file_lower or "db" in file_lower or "database" in file_lower):
                    steps.append("Queries database")
                elif "model" in prev_file and "database" in file_lower:
                    steps.append("Accesses data store")
                else:
                    steps.append(f"→ {file_path.split('/')[-1]}")
        
        return steps


def trace_data_flow(
    start_file: str,
    dependencies: Dict[str, Set[str]],
    end_file: Optional[str] = None,
) -> Dict:
    """
    Convenience function: trace data flow from a start file.
    
    Args:
        start_file: Starting file (e.g., "src/components/UserCard.tsx")
        dependencies: Dependency graph dict
        end_file: Optional target file
        
    Returns:
        {
            "total_flows": 3,
            "flows": [...]
        }
    """
    graph = DependencyGraph()
    graph.imports = {k: v.copy() for k, v in dependencies.items()}
    return graph.trace_data_flow(start_file, end_file)

