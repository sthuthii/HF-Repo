// src/viewAdapter.ts
import { applyScoringOverrides } from './scoringOverrides';

// LOCAL TYPES ONLY - Do not import from types.ts to prevent breakage
export interface SimpleFile {
  path: string;
  role: string;
  confidence: number;
  dependencies: string[];
}

export interface RoleViewBucket {
  primary: SimpleFile[];
  supporting: SimpleFile[];
}

/**
 * Takes a raw list of classified files, cleans up the scores,
 * and groups them into clean buckets per role.
 */
export function adaptFilesToRoleViews(rawFiles: SimpleFile[]): Record<string, RoleViewBucket> {
  const views: Record<string, RoleViewBucket> = {};

  for (const file of rawFiles) {
    // 1. Apply our new scoring overrides (fixes tsconfig 50/50s)
    const overridden = applyScoringOverrides(file.path, { [file.role]: file.confidence });
    
    const finalRole = overridden.role;
    const finalConfidence = overridden.scores[finalRole] || file.confidence;

    // 2. Initialize bucket for this role if it doesn't exist
    if (!views[finalRole]) {
      views[finalRole] = { primary: [], supporting: [] };
    }

    // 3. Create our clean, standardized file object
    const cleanFile: SimpleFile = {
      path: file.path,
      role: finalRole,
      confidence: finalConfidence,
      dependencies: file.dependencies || []
    };

    // 4. Sort into Primary (>70%) or Supporting (>30%)
    if (finalConfidence >= 0.7) {
      views[finalRole].primary.push(cleanFile);
    } else if (finalConfidence >= 0.3) {
      views[finalRole].supporting.push(cleanFile);
    }
    // Files < 30% are discarded as "noise" to keep the UI clean
  }

  // 5. Sort files inside each bucket by confidence (highest first) and limit to 5
  for (const role of Object.keys(views)) {
    views[role].primary.sort((a, b) => b.confidence - a.confidence).splice(5);
    views[role].supporting.sort((a, b) => b.confidence - a.confidence).splice(5);
  }

  return views;
}