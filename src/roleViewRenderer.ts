// src/roleViewRenderer.ts
import { RoleViewBucket } from './viewAdapter';

/**
 * PURE STRING MANIPULATION - No core imports.
 * Turns clean JSON buckets into beautiful ASCII terminal output.
 */
export function renderRoleView(role: string, view: RoleViewBucket): string {
  const total = view.primary.length + view.supporting.length;
  const emoji = getEmoji(role);
  const title = `${role.charAt(0).toUpperCase() + role.slice(1)} Engineer View`;

  let output = `\n═══════════════════════════════════════════════════════════════════════════\n`;
  output += `${emoji}  ${title}\n`;
  output += `═══════════════════════════════════════════════════════════════════════════\n\n`;
  output += `📊 Files: ${view.primary.length} primary • ${view.supporting.length} supporting (${total} total)\n`;

  // Render PRIMARY FILES
  if (view.primary.length > 0) {
    output += `───────────────────────────────────────────────────────────────────────────\n  📁 PRIMARY FILES\n───────────────────────────────────────────────────────────────────────────\n`;
    for (const file of view.primary) {
      output += `  • ${file.path} (Confidence: ${Math.round(file.confidence * 100)}%)\n`;
      if (file.dependencies.length > 0) {
        output += `    ↳ Deps: ${file.dependencies.join(', ')}\n`;
      }
    }
  }

  // Render SUPPORTING FILES
  if (view.supporting.length > 0) {
    output += `───────────────────────────────────────────────────────────────────────────\n  📄 SUPPORTING FILES\n───────────────────────────────────────────────────────────────────────────\n`;
    for (const file of view.supporting) {
      output += `  • ${file.path} (Confidence: ${Math.round(file.confidence * 100)}%)\n`;
    }
  }

  // Render MVP MUST KNOW section (Hardcoded for speed/safety as per PM plan)
  output += `\n───────────────────────────────────────────────────────────────────────────\n  💡 MUST KNOW\n───────────────────────────────────────────────────────────────────────────\n\n`;
  output += `  Quick tip: Focus on the primary files first to understand the core architecture.\n`;
  output += `  Review dependencies to see how data flows through the system.\n`;
  
  output += `\n═══════════════════════════════════════════════════════════════════════════\n`;

  return output;
}

function getEmoji(role: string): string {
  const map: Record<string, string> = {
    frontend: '🎨',
    backend: '⚙️',
    devops: '🚀',
    data: '🗄️',
    qa: '🧪',
    security: '🔒',
    ai_ml: '🤖',
    full_stack: '🔗'
  };
  return map[role] || '📁';
}