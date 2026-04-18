"use strict";
// src/roleViewCLIRenderer.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderRoleView = renderRoleView;
const onboardingSystem_1 = require("./onboardingSystem");
function renderRoleView(role, scoredFiles) {
    // FIX: Actually count the files passed into the function
    const primaryFiles = scoredFiles.filter(f => f.primaryRole === role);
    const supportingFiles = scoredFiles.filter(f => f.primaryRole !== role);
    const total = scoredFiles.length;
    const onboarding = (0, onboardingSystem_1.generateOnboardingView)(role, scoredFiles);
    let output = `
═══════════════════════════════════════════════════════════════════════════
⚙️  ${role.charAt(0).toUpperCase() + role.slice(1)} Engineer View
═══════════════════════════════════════════════════════════════════════════

 ${onboarding.overview}

📊 Files: ${primaryFiles.length} primary • ${supportingFiles.length} supporting • 0 context (${total} total)
`;
    if (primaryFiles.length > 0) {
        output += `───────────────────────────────────────────────────────────────────────────\n  📁 PRIMARY FILES\n───────────────────────────────────────────────────────────────────────────\n`;
        primaryFiles.forEach(f => {
            output += `  • ${f.file} (Confidence: ${Math.round(f.confidence * 100)}%)\n`;
        });
    }
    else {
        output += `───────────────────────────────────────────────────────────────────────────\n  ⚠️  WARNINGS\n───────────────────────────────────────────────────────────────────────────\n  • ${role} has no dependencies - check if properly analyzed\n`;
    }
    output += `
───────────────────────────────────────────────────────────────────────────
💡 NEXT STEPS
───────────────────────────────────────────────────────────────────────────
  Start with: ${onboarding.entryPoints[0] || 'N/A'}
═══════════════════════════════════════════════════════════════════════════\n`;
    return output;
}
//# sourceMappingURL=roleViewCLIRenderer.js.map