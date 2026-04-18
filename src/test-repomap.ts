import { RepoMapV2, createRepoMapV2 } from "./repoMapV2";
import { ImprovedScoringEngine } from "./improvedScoringEngine";
import { RoleViewCLIRenderer } from "./roleViewCLIRenderer";
import { ExplanationEngine } from "./explanationEngine";
import { Role } from "./config";

// Test scoring engine
console.log("=== Testing Scoring Engine ===");
const classification = {
  file: "src/api/controllers/user.ts",
  fileType: ".ts",
  primaryRole: Role.BACKEND,
  scores: { [Role.BACKEND]: 0.85, [Role.FRONTEND]: 0.2 },
  confidence: 0.65,
};
const enhanced = ImprovedScoringEngine.enhanceScores(classification, "src/api/controllers/user.ts");
console.log("Enhanced scores:", enhanced);

// Test explanation engine
console.log("\n=== Testing Explanation Engine ===");
const explanation = ExplanationEngine.explainFileRelevance(
  "src/components/Button.tsx",
  Role.FRONTEND,
  0.95,
  Role.FRONTEND
);
console.log("Explanation:", explanation);

// Test enhanced onboarding
console.log("\n=== Testing Enhanced Onboarding ===");
const repomap = createRepoMapV2();
const onboarding = repomap.getEnhancedOnboarding(Role.FRONTEND);
console.log("Onboarding view:", JSON.stringify(onboarding, null, 2).slice(0, 500) + "...");

// Test role view rendering
console.log("\n=== Testing CLI Rendering ===");
const roleView = repomap.getEnhancedRoleView(Role.BACKEND);
const rendered = RoleViewCLIRenderer.render(roleView);
console.log(rendered);