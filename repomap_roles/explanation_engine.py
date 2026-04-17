"""
# IMPORTANT UX FIX:
# Avoid generic explanations like:
# "provides context", "helps system understand architecture"

# MUST include:
# - actual file responsibility
# - real dependency relationship
Explanation engine for role-aware file relevance.

Generates explanations for:
1. Why a file is shown
2. Role-specific summaries
3. Relevance and confidence
"""

from typing import Dict, List, Optional
import re

from config import Role, ROLE_DESCRIPTIONS


class ExplanationEngine:
    """Generates human-readable explanations for file relevance."""
    
    # ============================================
    # CORE EXPLANATION FUNCTIONS
    # ============================================
    
    @staticmethod
    def explain_file_relevance(
        file_path: str,
        role: Role,
        score: float,
        primary_role: str,
        reason: str = "",
    ) -> str:
        """
        Generate concise, specific explanation for why a file is shown for a role.
        
        Args:
            file_path: Path to file
            role: Target role
            score: Relevance score (0.0-1.0)
            primary_role: Primary role detected
            reason: Additional context
            
        Returns:
            Concise human-readable explanation
        """
        file_type = file_path.split('.')[-1].lower()
        file_name = file_path.split('/')[-1] if '/' in file_path else file_path
        dir_path = '/'.join(file_path.split('/')[:-1]) if '/' in file_path else ''
        
        # Build concise explanation based on file characteristics
        # Prioritize specific, actionable info over generic boilerplate
        
        if score > 0.7:
            # PRIMARY files
            if "controller" in file_path.lower() or "handler" in file_path.lower():
                return f"API request handler - core {role.value} logic for processing requests."
            elif any(x in file_path.lower() for x in ['component', 'tsx', 'jsx']):
                return f"UI component - renders the {role.value} interface."
            elif "service" in file_path.lower() and "auth" in file_path.lower():
                return f"Authentication service - handles JWT tokens, login/logout for backend security."
            elif "service" in file_path.lower():
                return f"Business logic service - core {role.value} operations and data processing."
            elif "model" in file_path.lower():
                return f"Data model - defines schema and structure for {role.value} entities."
            elif file_type in ['dockerfile', 'yml', 'yaml']:
                return f"Infrastructure definition - configures {role.value} deployment and runtime."
            elif "test" in file_path.lower():
                return f"Test suite - validates {role.value} functionality and edge cases."
            else:
                return f"Core {role.value} file ({score:.0%}) - directly used in {role.value} workflow."
                
        elif score > 0.4:
            # SUPPORTING files
            if "middleware" in file_path.lower():
                return f"Middleware component - processes requests before {role.value} handlers."
            elif "auth" in file_path.lower():
                return f"Authentication logic - secures {role.value} operations."
            elif "model" in file_path.lower():
                return f"Data model - shared schema used by {role.value} modules."
            elif "util" in file_path.lower() or "helper" in file_path.lower():
                return f"Utility functions - provides shared helpers for {role.value} code."
            elif "config" in file_path.lower() or "settings" in file_path.lower():
                return f"Configuration - sets parameters affecting {role.value} behavior."
            elif "test" in file_path.lower():
                return f"Test file - ensures {role.value} code quality and correctness."
            else:
                return f"Related dependency ({score:.0%}) - supports {role.value} operations."
                
        else:
            # CONTEXT files
            if "readme" in file_path.lower():
                return f"Documentation - explains {role.value} features and usage."
            elif "test" in file_path.lower():
                return f"Integration test - shows how {role.value} components work together."
            elif "api" in file_path.lower() and role.value == "frontend":
                return f"Backend API - frontend calls this to fetch/update data."
            elif "component" in file_path.lower() and role.value == "backend":
                return f"UI component - frontend code that calls your backend APIs."
            elif "auth" in file_path.lower():
                return f"Authentication - {role.value} may need to understand security requirements."
            else:
                return f"Related file - provides context for understanding {role.value} role."
    
    @staticmethod
    def _explain_primary(
        file_path: str,
        role: Role,
        file_type: str,
        primary_role: str
    ) -> str:
        """Explanation for PRIMARY priority files."""
        
        role_value = role.value
        
        explanations = {
            Role.FRONTEND: {
                "component": f"Core frontend component - renders UI for {role_value} users",
                "page": f"Page component - primary navigation/layout for {role_value} experience",
                "hook": f"Custom React hook - shared UI logic used by frontend components",
                "style": f"Styling rules - controls visual presentation of {role_value} interface",
                "default": f"Frontend file - directly used in {role_value} interface",
            },
            Role.BACKEND: {
                "controller": f"Request handler - processes {role_value} API requests",
                "service": f"Business logic - core functionality for {role_value} operations",
                "model": f"Data model - defines {role_value} entity structure",
                "route": f"API route - endpoint consumed by {role_value} services",
                "default": f"Backend file - core {role_value} business logic",
            },
            Role.DEVOPS: {
                "dockerfile": f"Container definition - deployment artifact for {role_value} environment",
                "yaml": f"Infrastructure config - infrastructure-as-code for {role_value} deployment",
                "tf": f"Terraform module - cloud infrastructure for {role_value} services",
                "sh": f"Deployment script - orchestration for {role_value} deployment",
                "default": f"Infrastructure file - critical for {role_value} deployment",
            },
            Role.DATA: {
                "sql": f"Database query - data access pattern for {role_value} operations",
                "py": f"ETL script - data pipeline for {role_value} processing",
                "default": f"Data file - part of {role_value} data pipeline",
            },
        }
        
        role_explanations = explanations.get(role, {})
        return role_explanations.get(file_type.lower(), role_explanations.get("default", ""))
    
    @staticmethod
    def _explain_supporting(
        file_path: str,
        role: Role,
        reason: str = ""
    ) -> str:
        """Explanation for SUPPORTING priority files."""
        
        if reason:
            return f"Supporting file: {reason}. Related to {role.value} workflow."
        
        # Infer from file path
        if "test" in file_path.lower():
            return f"Test file - validates {role.value} functionality"
        elif "util" in file_path.lower() or "helper" in file_path.lower():
            return f"Utility module - provides shared functions used by {role.value} code"
        elif "config" in file_path.lower():
            return f"Configuration - settings affecting {role.value} environment"
        elif "type" in file_path.lower() or "interface" in file_path.lower():
            return f"Type definitions - schemas used by {role.value} code"
        else:
            return f"Related file - imported by {role.value}-relevant code"
    
    @staticmethod
    def _explain_context(
        file_path: str,
        role: Role,
        reason: str = ""
    ) -> str:
        """Explanation for CONTEXT priority files."""
        
        if reason:
            return f"Context file: {reason}"
        
        return f"Additional context - provides broader understanding for {role.value}"
    
    # ============================================
    # ROLE-SPECIFIC SUMMARIES
    # ============================================
    
    @staticmethod
    def generate_role_summary(
        file_content: str,
        file_path: str,
        role: Role,
        cached_summary: Optional[str] = None,
    ) -> str:
        """
        Generate role-specific summary of file.
        
        Args:
            file_content: File content (or summary)
            file_path: Path to file
            role: Target role
            cached_summary: Pre-computed summary (if available)
            
        Returns:
            Role-tailored summary
        """
        
        # Use cached if available
        if cached_summary:
            return ExplanationEngine._tailor_summary_to_role(cached_summary, role)
        
        # Generate summary based on file type
        file_ext = file_path.split('.')[-1].lower()
        
        if file_ext in ['tsx', 'jsx', 'vue']:
            return ExplanationEngine._summarize_component(file_content, role)
        elif file_ext in ['ts', 'js', 'py']:
            return ExplanationEngine._summarize_code(file_content, role)
        elif file_ext in ['yaml', 'yml', 'json']:
            return ExplanationEngine._summarize_config(file_content, role)
        elif file_ext in ['sql']:
            return ExplanationEngine._summarize_query(file_content, role)
        else:
            return "File content summary (role-specific view available)"
    
    @staticmethod
    def _summarize_component(content: str, role: Role) -> str:
        """Summarize a React/Vue component."""
        
        # Extract JSX/component structure
        functions = re.findall(r'function\s+(\w+)|const\s+(\w+)\s*=', content)
        hooks = re.findall(r'use\w+', content)
        props_match = re.search(r'interface\s+\w+Props|type\s+\w+Props', content)
        
        summary = "Component structure: "
        if functions:
            func_names = [f[0] or f[1] for f in functions]
            summary += f"exports {', '.join(func_names[:3])}. "
        
        if hooks:
            unique_hooks = list(set(hooks))
            summary += f"Uses hooks: {', '.join(unique_hooks[:3])}. "
        
        if role == Role.FRONTEND:
            summary += "This is a UI component. Key for rendering and user interaction."
        elif role == Role.BACKEND:
            summary += "Frontend component - references this from client-side code."
        
        return summary
    
    @staticmethod
    def _summarize_code(content: str, role: Role) -> str:
        """Summarize a code file."""
        
        # Extract exports/definitions
        exports = re.findall(r'export\s+(function|class|const|interface)\s+(\w+)', content)
        imports = re.findall(r'import.*?from\s+[\'"]([^\'"]+)[\'"]', content)
        
        summary = f"Defines: {len(exports)} exports. "
        if exports:
            export_names = [e[1] for e in exports[:3]]
            summary += f"Including {', '.join(export_names)}. "
        
        if imports:
            summary += f"Depends on {len(imports)} modules."
        
        if role == Role.BACKEND:
            if any(keyword in content.lower() for keyword in ['route', 'app.', 'handler']):
                summary += " Core API endpoint file."
        elif role == Role.FRONTEND:
            if any(keyword in content.lower() for keyword in ['component', 'render', 'jsx']):
                summary += " Component logic."
        
        return summary
    
    @staticmethod
    def _summarize_config(content: str, role: Role) -> str:
        """Summarize a config file (YAML/JSON)."""
        
        if role == Role.DEVOPS:
            if 'image' in content.lower():
                return "Deployment configuration - specifies container images and environment."
            elif 'resource' in content.lower():
                return "Infrastructure config - defines cloud resources."
            else:
                return "Configuration file - affects deployment environment."
        
        return "Configuration file - provides settings for application behavior."
    
    @staticmethod
    def _summarize_query(content: str, role: Role) -> str:
        """Summarize a SQL query."""
        
        if "CREATE TABLE" in content:
            tables = re.findall(r'CREATE TABLE\s+(\w+)', content)
            return f"Schema definition: creates table(s) {', '.join(tables)}"
        elif "SELECT" in content:
            return "Query file - retrieves data from database"
        elif "INSERT" in content or "UPDATE" in content:
            return "Mutation file - modifies database records"
        
        return "Database file - part of data access layer"
    
    @staticmethod
    def _tailor_summary_to_role(summary: str, role: Role) -> str:
        """Tailor an existing summary for a specific role."""
        
        # Add role-specific context to summary
        role_context = {
            Role.FRONTEND: " (Frontend impact: affects UI/UX)",
            Role.BACKEND: " (Backend impact: affects server-side logic)",
            Role.DEVOPS: " (DevOps impact: affects deployment)",
            Role.DATA: " (Data impact: affects data pipeline)",
            Role.SECURITY: " (Security impact: affects auth/encryption)",
        }
        
        if len(summary) > 100:
            return summary
        
        return summary + role_context.get(role, "")
    
    # ============================================
    # BATCH EXPLANATIONS
    # ============================================
    
    @staticmethod
    def explain_files_batch(
        files: List[Dict],  # {"file": path, "score": float, "role": Role}
        role: Role,
    ) -> List[Dict]:
        """
        Generate explanations for multiple files.
        
        Args:
            files: List of file metadata
            role: Target role
            
        Returns:
            Files with explanations added
        """
        results = []
        
        for file_info in files:
            explanation = ExplanationEngine.explain_file_relevance(
                file_path=file_info.get("file", ""),
                role=role,
                score=file_info.get("score", 0.5),
                primary_role=file_info.get("primary_role", "unknown"),
                reason=file_info.get("reason", ""),
            )
            
            file_info["explanation"] = explanation
            results.append(file_info)
        
        return results


def explain_file_relevance(
    file_path: str,
    role: Role,
    score: float,
) -> str:
    """
    Convenience function: explain file relevance for a role.
    
    Example:
        explanation = explain_file_relevance("api/controller.ts", Role.BACKEND, 0.95)
    """
    return ExplanationEngine.explain_file_relevance(
        file_path=file_path,
        role=role,
        score=score,
        primary_role="backend",
    )
