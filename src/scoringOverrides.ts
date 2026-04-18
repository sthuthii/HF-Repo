export function applyScoringOverrides(
  filePath: string,
  currentScores: Record<string, number>
): { role: string; scores: Record<string, number> } {
  
  // Extract just the filename (handles both Windows \ and Linux / paths)
  const fileName = filePath.split(/[/\\]/).pop() || filePath;

  // Hardcoded exact matches for files that should NEVER have 50/50 splits
  const exactMatches: Record<string, string> = {
    'tsconfig.json': 'devops',
    'package.json': 'devops',
    'package-lock.json': 'devops',
    '.gitignore': 'devops',
    '.env': 'devops',
    'vite.config.ts': 'devops',
    'eslint.config.js': 'devops',
  };

  // Hardcoded suffix matches
  const suffixMatches: Array<{ suffix: string; role: string }> = [
    { suffix: 'tsconfig.app.json', role: 'devops' },
    { suffix: 'tsconfig.node.json', role: 'devops' },
  ];

  let overrideRole: string | null = null;

  if (exactMatches[fileName]) {
    overrideRole = exactMatches[fileName];
  } else {
    for (const rule of suffixMatches) {
      if (fileName.endsWith(rule.suffix)) {
        overrideRole = rule.role;
        break;
      }
    }
  }

  // If no override applies, return the original data untouched
  if (!overrideRole) {
    const topRole = Object.entries(currentScores).sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';
    return { role: topRole, scores: currentScores };
  }

  // If an override applies, force that role to 100% and set others to 0%
  const newScores: Record<string, number> = {};
  for (const key of Object.keys(currentScores)) {
    newScores[key] = key === overrideRole ? 1.0 : 0.0;
  }
  
  // Fallback incase the override role wasn't in the original scores object
  if (!(overrideRole in newScores)) {
    newScores[overrideRole] = 1.0;
  }

  return { role: overrideRole, scores: newScores };
}