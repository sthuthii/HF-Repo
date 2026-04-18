import { ScoredFile } from './improvedScoringEngine';
export declare function generateOnboardingView(role: string, scoredFiles: ScoredFile[]): {
    role: string;
    overview: string;
    entryPoints: string[];
    learningPath: {
        step: number;
        description: string;
        files: string[];
        focus: string;
    }[];
};
//# sourceMappingURL=onboardingSystem.d.ts.map