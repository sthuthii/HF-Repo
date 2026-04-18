"use strict";
/**
 * Repository summary generator.
 *
 * Creates a high-level overview of the repository:
 * - What types of files exist
 * - What are the key architectural patterns
 * - What's the main tech stack
 * - What are critical areas to understand
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositorySummaryGenerator = void 0;
const repoAnalyzer_1 = require("./repoAnalyzer");
class RepositorySummaryGenerator {
    /**
     * Generate a comprehensive repository summary.
     */
    static generate(options) {
        const { classifications, dependencies, dependents = {}, analysis, } = options;
        // Run analysis if not provided
        const repoAnalysis = analysis || repoAnalyzer_1.RepositoryAnalyzer.analyze({
            classifications,
            dependencies,
            dependents,
        });
        // Calculate statistics
        const stats = this.calculateStatistics(classifications);
        // Determine architecture type
        const architecture = this.determineArchitecture(classifications, repoAnalysis);
        // Extract key technologies
        const keyTechs = this.extractKeyTechnologies(repoAnalysis);
        // Identify critical files
        const criticalFiles = repoAnalysis.keyFiles
            .filter((f) => f.inDegree >= 5)
            .slice(0, 5)
            .map((f) => f.path);
        // Get architectural layers
        const layers = repoAnalysis.architecturalTiers.map((t) => t.tier);
        // Generate one-line overview
        const overview = this.generateOverview(stats, architecture);
        // Generate description
        const description = this.generateDescription(stats, keyTechs, architecture);
        // Generate recommendations
        const recommendations = this.generateRecommendations(stats, repoAnalysis, classifications);
        // Determine complexity
        const complexity = this.determineComplexity(stats, repoAnalysis, classifications);
        return {
            overview,
            description,
            architecture,
            keyTechnologies: keyTechs,
            criticalFiles,
            architecturalLayers: layers,
            recommendations,
            complexity,
        };
    }
    /**
     * Calculate statistics about the repository.
     */
    static calculateStatistics(classifications) {
        const roleDistribution = {};
        const confidences = [];
        for (const result of classifications) {
            roleDistribution[result.primaryRole] =
                (roleDistribution[result.primaryRole] || 0) + 1;
            confidences.push(result.confidence);
        }
        confidences.sort((a, b) => a - b);
        return {
            totalFiles: classifications.length,
            roleDistribution,
            avgConfidence: confidences.reduce((a, b) => a + b, 0) / confidences.length,
            medianConfidence: confidences[Math.floor(confidences.length / 2)],
            minConfidence: confidences[0],
            maxConfidence: confidences[confidences.length - 1],
        };
    }
    /**
     * Determine the overall architecture type.
     */
    static determineArchitecture(classifications, analysis) {
        const roles = new Set(classifications.map((c) => c.primaryRole));
        // Check what roles are present
        const hasFrontend = roles.has("frontend");
        const hasBackend = roles.has("backend");
        const hasData = roles.has("data");
        const hasML = roles.has("ai_ml");
        const hasDevops = roles.has("devops");
        const hasQA = roles.has("qa");
        // Determine architecture
        if (hasFrontend && hasBackend) {
            return "Full-stack web application";
        }
        else if (hasBackend && hasData) {
            return "Backend service with data layer";
        }
        else if (hasML && hasData) {
            return "ML/Data science project";
        }
        else if (hasBackend && hasDevops) {
            return "Backend service with infrastructure";
        }
        else if (hasFrontend) {
            return "Frontend-focused application";
        }
        else if (hasML) {
            return "Machine learning project";
        }
        else if (hasData) {
            return "Data processing project";
        }
        else if (hasDevops) {
            return "Infrastructure/DevOps focused";
        }
        else {
            return "Mixed/specialized architecture";
        }
    }
    /**
     * Extract key technologies from dependencies.
     */
    static extractKeyTechnologies(analysis) {
        const techs = [];
        // Extract from external dependencies
        for (const dep of analysis.externalDependencies.slice(0, 5)) {
            const name = dep.name.split("/")[0].toLowerCase();
            // Map common packages to tech names
            const techMap = {
                react: "React",
                vue: "Vue.js",
                angular: "Angular",
                express: "Express.js",
                fastapi: "FastAPI",
                django: "Django",
                flask: "Flask",
                tensorflow: "TensorFlow",
                torch: "PyTorch",
                pytorch: "PyTorch",
                postgres: "PostgreSQL",
                mongodb: "MongoDB",
                mysql: "MySQL",
                redis: "Redis",
                docker: "Docker",
                kubernetes: "Kubernetes",
                jest: "Jest",
                mocha: "Mocha",
                pytest: "pytest",
            };
            if (techMap[name]) {
                techs.push(techMap[name]);
            }
            else if (name.length > 2 && name.length < 20) {
                // Generic tech names
                techs.push(name.charAt(0).toUpperCase() + name.slice(1));
            }
        }
        // Add patterns from architecture
        for (const pattern of analysis.keyPatterns.slice(0, 3)) {
            if (pattern.pattern === "service-layer") {
                techs.push("Microservices");
            }
            else if (pattern.pattern === "mvc-controller") {
                techs.push("MVC Pattern");
            }
        }
        return [...new Set(techs)].slice(0, 7); // Remove duplicates, top 7
    }
    /**
     * Generate one-line overview.
     */
    static generateOverview(stats, architecture) {
        const roleCount = Object.keys(stats.roleDistribution).length;
        const confidence = (stats.avgConfidence * 100).toFixed(0);
        return `${architecture} with ${stats.totalFiles} files across ${roleCount} roles (${confidence}% classification confidence)`;
    }
    /**
     * Generate 2-3 sentence description.
     */
    static generateDescription(stats, keyTechs, architecture) {
        const largestRole = Object.entries(stats.roleDistribution).sort(([, a], [, b]) => b - a)[0];
        const techString = keyTechs.length > 0 ? ` Built with ${keyTechs.slice(0, 3).join(", ")}.` : "";
        return `This is a ${architecture} project containing ${stats.totalFiles} files. The largest component is ${largestRole[0]} with ${largestRole[1]} files.${techString}`;
    }
    /**
     * Generate recommendations.
     */
    static generateRecommendations(stats, analysis, classifications) {
        const recommendations = [];
        // Confidence recommendations
        if (stats.avgConfidence < 0.6) {
            recommendations.push("Low average confidence - review classifier keywords or provide more training data");
        }
        // Complexity recommendations
        const totalFiles = classifications.length;
        if (totalFiles > 100) {
            recommendations.push("Large codebase - focus on key files first before deep analysis");
        }
        // Pattern recommendations
        if (analysis.keyPatterns.length === 0) {
            recommendations.push("No clear architectural patterns detected - may benefit from refactoring");
        }
        // Dependency recommendations
        const criticalDeps = analysis.externalDependencies.filter((d) => d.criticality === "critical");
        if (criticalDeps.length > 0) {
            recommendations.push(`${criticalDeps.length} critical external dependencies - ensure they're well-tested`);
        }
        // Role distribution recommendations
        const singleRoleFiles = Object.values(stats.roleDistribution).filter((count) => count === 1).length;
        if (singleRoleFiles > 5) {
            recommendations.push("Many isolated role files - may indicate scattered functionality");
        }
        return recommendations.slice(0, 4); // Top 4 recommendations
    }
    /**
     * Determine overall complexity level.
     */
    static determineComplexity(stats, analysis, classifications) {
        let score = 0;
        // File count
        if (stats.totalFiles > 500) {
            score += 4;
        }
        else if (stats.totalFiles > 200) {
            score += 3;
        }
        else if (stats.totalFiles > 50) {
            score += 2;
        }
        else {
            score += 1;
        }
        // Role diversity
        const roleCount = Object.keys(stats.roleDistribution).length;
        if (roleCount >= 7) {
            score += 3;
        }
        else if (roleCount >= 4) {
            score += 2;
        }
        else {
            score += 1;
        }
        // Dependency complexity
        const depComplexity = analysis.externalDependencies.length +
            analysis.internalModules.length;
        if (depComplexity > 50) {
            score += 3;
        }
        else if (depComplexity > 20) {
            score += 2;
        }
        else {
            score += 1;
        }
        // Pattern diversity
        if (analysis.keyPatterns.length > 5) {
            score += 2;
        }
        else if (analysis.keyPatterns.length > 2) {
            score += 1;
        }
        // Architectural tiers
        if (analysis.architecturalTiers.length >= 4) {
            score += 2;
        }
        else if (analysis.architecturalTiers.length >= 2) {
            score += 1;
        }
        // Tier-based complexity rating
        if (score >= 14) {
            return "very-complex";
        }
        else if (score >= 10) {
            return "complex";
        }
        else if (score >= 5) {
            return "moderate";
        }
        else {
            return "simple";
        }
    }
    /**
     * Format summary for CLI display.
     */
    static formatForCLI(summary) {
        let output = "\n📊 REPOSITORY SUMMARY\n";
        output += "=".repeat(70) + "\n\n";
        output += `Overview:\n  ${summary.overview}\n\n`;
        output += `Description:\n  ${summary.description}\n\n`;
        output += `Architecture: ${summary.architecture}\n`;
        output += `Complexity: ${summary.complexity.toUpperCase()}\n\n`;
        if (summary.keyTechnologies.length > 0) {
            output += `Key Technologies:\n  ${summary.keyTechnologies.join(", ")}\n\n`;
        }
        if (summary.architecturalLayers.length > 0) {
            output += `Architectural Layers:\n  ${summary.architecturalLayers.join(", ")}\n\n`;
        }
        if (summary.criticalFiles.length > 0) {
            output += `Critical Files to Understand:\n`;
            for (const file of summary.criticalFiles) {
                output += `  • ${file}\n`;
            }
            output += "\n";
        }
        if (summary.recommendations.length > 0) {
            output += `Recommendations:\n`;
            for (const rec of summary.recommendations) {
                output += `  • ${rec}\n`;
            }
        }
        return output;
    }
}
exports.RepositorySummaryGenerator = RepositorySummaryGenerator;
//# sourceMappingURL=repositorySummary.js.map