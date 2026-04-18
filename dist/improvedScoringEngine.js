"use strict";
// src/improvedScoringEngine.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreFile = scoreFile;
// Helper to fix floating point precision issues
const roundScore = (num) => Math.round(num * 100) / 100;
function scoreFile(filePath, content) {
    const ext = filePath.split('.').pop() || '';
    const lowerPath = filePath.toLowerCase();
    const lowerContent = content.toLowerCase();
    // Basic heuristic scoring based on keywords and paths
    let backendScore = 0;
    let frontendScore = 0;
    if (lowerPath.includes('controller') || lowerPath.includes('route') || lowerPath.includes('service'))
        backendScore += 0.4;
    if (lowerContent.includes('express') || lowerContent.includes('fastify') || lowerContent.includes('res.send'))
        backendScore += 0.3;
    if (lowerContent.includes('select *') || lowerContent.includes('prisma') || lowerContent.includes('typeorm'))
        backendScore += 0.3;
    if (lowerPath.includes('component') || lowerPath.includes('page'))
        frontendScore += 0.4;
    if (lowerContent.includes('react') || lowerContent.includes('vue') || lowerContent.includes('angular'))
        frontendScore += 0.3;
    if (lowerContent.includes('return <') || lowerContent.includes('render('))
        frontendScore += 0.3;
    const scores = {
        backend: roundScore(Math.min(backendScore, 1)),
        frontend: roundScore(Math.min(frontendScore, 1))
    };
    // Determine primary role
    const primaryRole = scores.backend >= scores.frontend ? 'backend' : 'frontend';
    const confidence = roundScore(Math.max(scores.backend, scores.frontend));
    return {
        file: filePath,
        fileType: `.${ext}`,
        primaryRole,
        scores,
        confidence
    };
}
//# sourceMappingURL=improvedScoringEngine.js.map