"""
LLM Prompt Templates for role-aware summarization.

These templates are designed to:
- Minimize token usage
- Reuse cached summaries
- Maintain role-specific context
"""


class PromptTemplates:
    """Collection of LLM prompt templates."""
    
    # ============================================
    # SUMMARY GENERATION
    # ============================================
    
    @staticmethod
    def generate_generic_summary(file_content: str, file_path: str) -> str:
        """
        Template to generate a comprehensive generic file summary.
        
        This summary is cached and reused for all roles.
        """
        file_type = file_path.split('.')[-1]
        return f"""Provide a concise but complete summary of this {file_type} file in 3-4 sentences.

Include:
1. Primary purpose of this file
2. Key classes/functions/exports
3. Main dependencies or imports
4. Overall role in the system

File path: {file_path}

Code:
```
{file_content[:2500]}
```

Summary:"""
    
    @staticmethod
    def summarize_file_for_role(file_content: str, role: str, file_path: str = "") -> str:
        """
        Template to generate a role-specific file summary.
        
        Usage:
            prompt = PromptTemplates.summarize_file_for_role(content, "backend", "src/api/user.ts")
            response = llm.complete(prompt)
        """
        return f"""Summarize this code for a {role} engineer in 2-3 sentences.

Focus on {get_role_focus(role)}

File: {file_path}
Code:
```
{file_content[:2000]}
```

Summary for {role}:"""
    
    @staticmethod
    def summarize_component(file_content: str) -> str:
        """Template for summarizing React/Vue components."""
        return f"""Summarize this UI component in 2-3 sentences.

Include:
- Component name and purpose
- Props and state it manages
- Key user interactions it handles

Code:
```
{file_content[:2000]}
```

Component Summary:"""
    
    @staticmethod
    def summarize_service(file_content: str) -> str:
        """Template for summarizing backend services/utilities."""
        return f"""Summarize this backend service in 2-3 sentences.

Include:
- Main functions/methods exported
- Primary responsibility
- Key dependencies

Code:
```
{file_content[:2000]}
```

Service Summary:"""
    
    @staticmethod
    def summarize_config(file_content: str, file_path: str) -> str:
        """Template for summarizing configuration files."""
        return f"""Summarize this configuration file in 2-3 sentences.

File: {file_path}

Include:
- What this configuration controls
- Key settings and their purposes
- Environments it affects

Config:
```
{file_content[:1500]}
```

Configuration Summary:"""
    
    @staticmethod
    def explain_data_flow(flow_path: list, start_file: str, end_file: str) -> str:
        """
        Template to explain a data flow path.
        
        Usage:
            path = ["component.tsx", "api/index.ts", "controller.ts", "model.ts"]
            prompt = PromptTemplates.explain_data_flow(path, path[0], path[-1])
            response = llm.complete(prompt)
        """
        path_str = " → ".join(flow_path)
        return f"""Explain this data flow path in one sentence:

{start_file} → ... → {end_file}

Path: {path_str}

Explanation:"""
    
    @staticmethod
    def identify_api_contracts(file_content: str) -> str:
        """
        Template to extract API contracts (request/response).
        
        Usage:
            prompt = PromptTemplates.identify_api_contracts(controller_content)
            response = llm.complete(prompt)
        """
        return f"""Extract API endpoints and their contracts from this code.

Format response as:
- Endpoint: /path
  Methods: GET, POST, etc
  Input: {{example request}}
  Output: {{example response}}

Code:
```
{file_content[:1500]}
```

Contracts:"""
    
    @staticmethod
    def explain_file_for_role(file_path: str, role: str, file_summary: str) -> str:
        """
        Template to tailor an existing summary for a role.
        
        This is lighter-weight than re-summarizing.
        """
        return f"""Given this file summary, explain its relevance to a {role}:

File: {file_path}
Current summary: {file_summary}
Role context: {get_role_focus(role)}

Relevance for {role}:"""
    
    # ============================================
    # CLASSIFICATION & CONFIDENCE
    # ============================================
    
    @staticmethod
    def classify_file_by_content(file_path: str, file_content: str) -> str:
        """
        Template to classify file by content analysis.
        
        Usage: Used for files that don't match simple heuristics.
        """
        return f"""Classify this file by role relevance:

File: {file_path}
Content preview:
```
{file_content[:500]}
```

Which role(s) is this most relevant to?
- frontend
- backend
- devops
- ai_ml
- data
- qa
- security

Most relevant: """
    
    # ============================================
    # DEPENDENCY ANALYSIS
    # ============================================
    
    @staticmethod
    def analyze_dependency_relevance(from_file: str, to_file: str) -> str:
        """
        Template to analyze if a dependency is semantically relevant.
        
        Usage: Validate dependency graph connections.
        """
        return f"""Is the dependency from '{from_file}' to '{to_file}' semantically relevant?

Context: This helps determine if files should be shown together for a role.

Answer: Yes/No
Reason:"""
    
    # ============================================
    # REPOSITORY OVERVIEW
    # ============================================
    
    @staticmethod
    def explain_repo_for_role(role: str, file_samples: list, description: str) -> str:
        """
        Template to generate repository overview for a role.
        
        Usage: "Explain this repo for this role" feature.
        """
        files_str = "\n".join([f"- {f}" for f in file_samples[:10]])
        return f"""Explain how this repository is structured for a {role}.

Repository description: {description}

Key files:
{files_str}

Structure for {role}:"""
    
    # ============================================
    # CACHED SUMMARY REUSE
    # ============================================
    
    @staticmethod
    def reuse_cached_summary(base_summary: str, role: str) -> str:
        """
        Ultra-lightweight template to adapt existing summary.
        
        This minimizes token usage by working with cached summaries.
        """
        return f"""Tailor this summary for {role}:

Summary: {base_summary}

For {role}:"""


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_role_focus(role: str) -> str:
    """Get key focus areas for a role."""
    focus_map = {
        "frontend": "UI components, rendering, state management, styling",
        "backend": "API endpoints, business logic, database queries, validation",
        "devops": "deployment, infrastructure, environment configuration, CI/CD",
        "ai_ml": "model architecture, training process, feature engineering, inference",
        "data": "data pipeline, transformations, schema, ETL logic",
        "qa": "test coverage, test cases, validation logic, error scenarios",
        "security": "authentication, authorization, encryption, input validation, vulnerabilities",
    }
    return focus_map.get(role, "general implementation details")


# ============================================
# CACHED SUMMARY MANAGER
# ============================================

class CachedSummaryManager:
    """
    Manages cached summaries to minimize LLM calls.
    
    Strategy:
    1. Store one generic summary per file
    2. Adapt cached summary for each role (lightweight)
    3. Only regenerate if file changes
    """
    
    def __init__(self):
        self.summaries = {}  # {"file_path": {"generic": "summary"}}
    
    def has_summary(self, file_path: str) -> bool:
        """Check if file has cached summary."""
        return file_path in self.summaries
    
    def get_summary(self, file_path: str, role: str = None) -> str:
        """
        Get summary for file (generic or role-adapted).
        
        Args:
            file_path: Path to file
            role: If provided, adapts generic summary for this role
            
        Returns:
            Summary string (or None if not cached)
        """
        if file_path not in self.summaries:
            return None
        
        summary = self.summaries[file_path]
        
        if role and "generic" in summary:
            # Adapt cached summary
            return self._adapt_summary(summary["generic"], role)
        
        return summary.get("generic")
    
    def store_summary(self, file_path: str, summary: str, file_hash: str = None) -> None:
        """
        Store summary for file.
        
        Args:
            file_path: Path to file
            summary: Generic summary
            file_hash: Hash of file content (for change detection)
        """
        self.summaries[file_path] = {
            "generic": summary,
            "hash": file_hash,
        }
    
    def _adapt_summary(self, generic_summary: str, role: str) -> str:
        """
        Adapt generic summary for specific role.
        This is a lightweight operation (no LLM call needed for simple cases).
        """
        role_keywords = {
            "frontend": ["UI", "component", "render", "styling"],
            "backend": ["API", "endpoint", "logic", "database"],
            "devops": ["deployment", "infrastructure", "config"],
            "data": ["pipeline", "ETL", "schema"],
        }
        
        keywords = role_keywords.get(role, [])
        
        # Simple keyword-based adaptation
        adaptation = f"For {role}: " + generic_summary
        for kw in keywords:
            if kw.lower() in generic_summary.lower():
                adaptation += f" (Key for {role} workflow)"
                break
        
        return adaptation


# ============================================
# EXAMPLE USAGE
# ============================================

if __name__ == "__main__":
    # Example: Generate summary prompt
    code_sample = """
    async function handleUserCreate(req: Request, res: Response) {
        const { email, password } = req.body;
        const user = await User.create({ email, password });
        res.json({ success: true, user });
    }
    """
    
    prompt = PromptTemplates.summarize_file_for_role(code_sample, "backend")
    print(prompt)
    print("\n---\n")
    
    # Example: Data flow explanation
    flow = ["UserCard.tsx", "api/getUser.ts", "userController.ts", "userModel.ts"]
    prompt = PromptTemplates.explain_data_flow(flow, flow[0], flow[-1])
    print(prompt)
