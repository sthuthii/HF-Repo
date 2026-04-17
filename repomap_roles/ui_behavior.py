"""
UI Behavior specification for role-aware views.

Describes how the frontend should present the role system to users.
"""


class UIBehavior:
    """Specifications for UI components and interactions."""
    
    # ============================================
    # MAIN VIEW: ROLE SELECTION
    # ============================================
    
    ROLE_SELECTOR = {
        "title": "Select Your Role",
        "description": "Choose how you want to explore this repository",
        "options": [
            {
                "value": "frontend",
                "label": "Frontend Developer",
                "icon": "🎨",
                "description": "UI components, styling, state management",
                "color": "#61DAFB",
            },
            {
                "value": "backend",
                "label": "Backend Developer",
                "icon": "⚙️",
                "description": "APIs, business logic, databases",
                "color": "#68A063",
            },
            {
                "value": "full_stack",
                "label": "Full Stack Developer",
                "icon": "🔄",
                "description": "Balanced view of frontend and backend",
                "color": "#F7DF1E",
            },
            {
                "value": "devops",
                "label": "DevOps Engineer",
                "icon": "🚀",
                "description": "Infrastructure, CI/CD, deployment",
                "color": "#FF6B35",
            },
            {
                "value": "ai_ml",
                "label": "AI/ML Engineer",
                "icon": "🧠",
                "description": "Models, training, pipelines",
                "color": "#9B59B6",
            },
            {
                "value": "data",
                "label": "Data Engineer",
                "icon": "📊",
                "description": "Data pipelines, warehousing, ETL",
                "color": "#3498DB",
            },
            {
                "value": "qa",
                "label": "QA/Test Engineer",
                "icon": "✅",
                "description": "Testing, automation, quality",
                "color": "#E74C3C",
            },
            {
                "value": "security",
                "label": "Security Engineer",
                "icon": "🔒",
                "description": "Auth, encryption, vulnerability management",
                "color": "#2C3E50",
            },
        ],
        "multi_select": True,
        "multi_select_label": "Compare multiple roles",
        "custom_role_button": True,
    }
    
    # ============================================
    # MAIN VIEW: ROLE-BASED FILE LIST
    # ============================================
    
    FILE_LIST_VIEW = {
        "layout": "grouped_by_priority",
        "sections": [
            {
                "id": "primary",
                "title": "🔥 Must Understand",
                "icon": "🔥",
                "description": "Core files for this role (high relevance)",
                "background_color": "#FFF3CD",
                "border_color": "#FFC107",
                "expanded_by_default": True,
                "max_shown": 10,
                "show_more_button": True,
            },
            {
                "id": "supporting",
                "title": "⚡ Related Logic",
                "icon": "⚡",
                "description": "Files that support the primary ones",
                "background_color": "#E7F3FF",
                "border_color": "#2196F3",
                "expanded_by_default": False,
                "max_shown": 10,
                "show_more_button": True,
            },
            {
                "id": "context",
                "title": "📦 Additional Context",
                "icon": "📦",
                "description": "Extra context for deeper understanding",
                "background_color": "#F0F0F0",
                "border_color": "#9E9E9E",
                "expanded_by_default": False,
                "max_shown": 10,
                "show_more_button": True,
            },
        ]
    }
    
    # ============================================
    # FILE CARD COMPONENT
    # ============================================
    
    FILE_CARD = {
        "layout": "horizontal",
        "elements": [
            {
                "type": "icon",
                "content": "file_type_icon",  # e.g., 📄 for .ts
                "position": "left",
            },
            {
                "type": "filename",
                "size": "medium",
                "weight": "bold",
                "truncate": True,
                "path_breadcrumb": True,
            },
            {
                "type": "relevance_badge",
                "format": "{score:.0%} relevance",
                "colors": {
                    "high": "#28A745",    # 0.7-1.0
                    "medium": "#FFC107",  # 0.4-0.69
                    "low": "#6C757D",     # 0.1-0.39
                },
            },
            {
                "type": "role_tags",
                "display": "chips",
                "format": "role badges for all relevant roles",
            },
            {
                "type": "actions",
                "buttons": [
                    {
                        "id": "view_details",
                        "label": "View",
                        "icon": "👁️",
                        "action": "open_file_details_modal",
                    },
                    {
                        "id": "trace_flow",
                        "label": "Trace Flow",
                        "icon": "🔗",
                        "action": "open_flow_tracer",
                    },
                    {
                        "id": "expand",
                        "label": "...",
                        "action": "show_context_menu",
                    },
                ],
            },
        ],
        "hover_effects": [
            "highlight_dependents",
            "show_tooltip_with_explanation",
        ],
    }
    
    # ============================================
    # FILE DETAILS MODAL
    # ============================================
    
    FILE_DETAILS_MODAL = {
        "title": "File Details",
        "sections": [
            {
                "name": "Overview",
                "items": [
                    {
                        "label": "File Path",
                        "type": "text",
                        "value": "{file_path}",
                        "copyable": True,
                    },
                    {
                        "label": "Primary Role",
                        "type": "badge",
                        "value": "{primary_role}",
                    },
                    {
                        "label": "Why You See This",
                        "type": "text",
                        "value": "{explanation}",
                        "icon": "ℹ️",
                    },
                    {
                        "label": "Summary",
                        "type": "text",
                        "value": "{summary}",
                        "expandable": True,
                    },
                ]
            },
            {
                "name": "Relevance",
                "items": [
                    {
                        "type": "role_scores_chart",
                        "format": "bar_chart",
                        "data": "{role_scores}",
                    },
                ]
            },
            {
                "name": "Dependencies",
                "items": [
                    {
                        "label": "Imports From",
                        "type": "file_list",
                        "files": "{dependencies}",
                        "clickable": True,
                        "max_shown": 5,
                    },
                    {
                        "label": "Imported By",
                        "type": "file_list",
                        "files": "{dependents}",
                        "clickable": True,
                        "max_shown": 5,
                    },
                ]
            },
        ],
        "buttons": [
            {
                "label": "View File",
                "action": "open_file_in_editor",
            },
            {
                "label": "Trace Data Flow",
                "action": "open_flow_tracer",
            },
            {
                "label": "Expand Context",
                "action": "expand_dependencies",
            },
        ]
    }
    
    # ============================================
    # DATA FLOW TRACER
    # ============================================
    
    DATA_FLOW_TRACER = {
        "title": "Trace Execution Flow",
        "description": "Follow how data flows through your code",
        "layout": "vertical_step_diagram",
        "elements": [
            {
                "type": "step",
                "content": "{flow_steps}",
                "visual": "connected_boxes_with_arrows",
            },
            {
                "type": "file_cards",
                "display": "clickable_cards_for_each_file",
            },
            {
                "type": "explanation",
                "display": "Human-readable flow description",
            },
            {
                "type": "confidence_indicator",
                "format": "{confidence:.0%} likely flow",
                "visual": "progress_bar",
            },
        ],
        "features": [
            "Switch between different flows",
            "Drill down into each step",
            "View code for each step",
            "Trace backwards from a file",
        ]
    }
    
    # ============================================
    # CONTEXT EXPANSION MENU
    # ============================================
    
    CONTEXT_MENU = {
        "title": "Explore Context",
        "options": [
            {
                "id": "show_more_backend",
                "label": "Show More Backend Context",
                "icon": "🔽",
                "description": "See additional backend files relevant to this file",
                "applies_to": ["frontend"],
            },
            {
                "id": "show_more_frontend",
                "label": "Show Frontend Usage",
                "icon": "🔽",
                "description": "See frontend components that use this backend file",
                "applies_to": ["backend"],
            },
            {
                "id": "expand_dependencies",
                "label": "Expand Dependencies",
                "icon": "🔄",
                "description": "Show files that import this file",
                "applies_to": ["all"],
            },
            {
                "id": "expand_dependents",
                "label": "Expand Dependents",
                "icon": "🔄",
                "description": "Show files that this file imports",
                "applies_to": ["all"],
            },
            {
                "id": "switch_role",
                "label": "View from Different Role",
                "icon": "👤",
                "description": "See how another role would view this file",
                "applies_to": ["all"],
            },
            {
                "id": "view_in_graph",
                "label": "View in Dependency Graph",
                "icon": "📈",
                "description": "Visualize this file and its connections",
                "applies_to": ["all"],
            },
        ]
    }
    
    # ============================================
    # TOOLTIPS & HELP TEXT
    # ============================================
    
    TOOLTIPS = {
        "primary_files": "Core files you must understand for this role",
        "supporting_files": "Files that support the main logic",
        "context_files": "Additional files for background context",
        "relevance_score": "How relevant this file is to your role (0-100%)",
        "trace_flow": "Follow execution path from this file to its dependencies",
        "expand_context": "Show more related files and dependencies",
        "switch_role": "View repository through a different role's perspective",
    }
    
    # ============================================
    # KEYBOARD SHORTCUTS
    # ============================================
    
    KEYBOARD_SHORTCUTS = {
        "cmd/ctrl + /": "Toggle role selector",
        "cmd/ctrl + k": "Search files",
        "arrow_up/down": "Navigate file list",
        "enter": "Open file details",
        "d": "Trace data flow",
        "e": "Expand context",
        "r": "Switch role view",
        "?": "Show help",
    }


# ============================================
# UI STATE MACHINE
# ============================================

class UIStateMachine:
    """Defines UI state transitions and behaviors."""
    
    states = {
        "ROLE_SELECTION": {
            "display": "Role selector modal",
            "transitions": {
                "role_selected": "VIEWING_ROLE",
                "custom_role": "CREATING_CUSTOM_ROLE",
            }
        },
        "VIEWING_ROLE": {
            "display": "Role-based file view with primary/supporting/context sections",
            "components": [
                "repository_overview",
                "file_list_by_priority",
                "context_expansion_controls",
            ],
            "transitions": {
                "file_clicked": "VIEWING_FILE_DETAILS",
                "trace_flow_clicked": "TRACING_DATA_FLOW",
                "expand_context": "EXPANDING_CONTEXT",
                "switch_role": "ROLE_SELECTION",
            }
        },
        "VIEWING_FILE_DETAILS": {
            "display": "Modal with file information and dependencies",
            "components": [
                "file_overview",
                "role_relevance_chart",
                "dependencies_section",
            ],
            "transitions": {
                "close": "VIEWING_ROLE",
                "trace_flow": "TRACING_DATA_FLOW",
                "expand_deps": "EXPANDING_CONTEXT",
                "open_in_editor": "EXTERNAL_ACTION",
            }
        },
        "TRACING_DATA_FLOW": {
            "display": "Step-by-step flow visualization",
            "components": [
                "flow_path_diagram",
                "step_descriptions",
                "file_drill_down",
            ],
            "transitions": {
                "close": "VIEWING_ROLE",
                "click_step": "VIEWING_FILE_DETAILS",
            }
        },
        "EXPANDING_CONTEXT": {
            "display": "Extended file list with more context",
            "components": [
                "file_list_by_priority",
                "additional_related_files",
                "dependency_graph_preview",
            ],
            "transitions": {
                "close": "VIEWING_ROLE",
                "file_clicked": "VIEWING_FILE_DETAILS",
            }
        },
        "CREATING_CUSTOM_ROLE": {
            "display": "Form to create custom role",
            "components": [
                "role_name_input",
                "keywords_input",
                "path_patterns_input",
            ],
            "transitions": {
                "create": "VIEWING_ROLE",
                "cancel": "ROLE_SELECTION",
            }
        }
    }
