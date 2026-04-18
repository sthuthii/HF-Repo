"use strict";
// src/onboardingSystem.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOnboardingView = generateOnboardingView;
function generateOnboardingView(role, scoredFiles) {
    // Filter files relevant to the requested role
    const roleFiles = scoredFiles
        .filter(f => f.primaryRole === role)
        .sort((a, b) => b.confidence - a.confidence);
    // Get actual file paths instead of "main-entry" placeholders
    const entryPoints = roleFiles.slice(0, 2).map(f => f.file);
    return {
        role,
        overview: role === 'backend'
            ? "Handles all APIs, business logic, and database interactions."
            : "Handles all user-facing interfaces and client-side logic.",
        entryPoints,
        learningPath: [
            {
                step: 1,
                description: "Understand the main entry points",
                files: entryPoints.length > 0 ? entryPoints : ["No files found for this role"],
                focus: "What does this module do?"
            },
            {
                step: 2,
                description: "Explore supporting dependencies",
                files: roleFiles.slice(2, 4).map(f => f.file),
                focus: "How do these files interact?"
            }
        ]
    };
}
//# sourceMappingURL=onboardingSystem.js.map