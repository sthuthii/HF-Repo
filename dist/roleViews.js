"use strict";
/**
 * Role-Aware Repository Views System
 *
 * Main system that orchestrates file classification, dependency analysis,
 * and role-specific view generation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleViewsSystem = void 0;
exports.createSystem = createSystem;
const config_1 = require("./config");
const roleClassifier_1 = require("./roleClassifier");
const priorityEngine_1 = require("./priorityEngine");
const dependencyGraph_1 = require("./dependencyGraph");
const explanationEngine_1 = require("./explanationEngine");
class RoleViewsSystem {
    constructor() {
        this.fileScoresCache = {};
        this.classifier = new roleClassifier_1.FileClassifier();
        this.dependencyGraph = new dependencyGraph_1.DependencyGraph();
    }
    /**
     * Initialize the system with a repository's files.
     */
    initializeRepository(files) {
        // Classify all files
        const results = this.classifier.classifyFilesBatch(files);
        for (const result of results) {
            this.fileScoresCache[result.file] = result.scores;
        }
        // Build dependency graph
        this.dependencyGraph.buildGraph(files);
    }
    /**
     * Get role-specific prioritized view of files.
     */
    getRoleView(role) {
        const fileScores = {};
        for (const [file, scores] of Object.entries(this.fileScoresCache)) {
            fileScores[file] = {};
            for (const r of Object.values(config_1.Role)) {
                fileScores[file][r] = scores[r] || 0.0;
            }
        }
        const view = priorityEngine_1.PriorityEngine.createRoleView(role, fileScores, this.dependencyGraph.imports);
        // Add explanations
        for (const priority of ["primary", "supporting", "context"]) {
            for (const pf of view[priority]) {
                pf.explanation = explanationEngine_1.ExplanationEngine.explainFileRelevance(pf.filePath, role, pf.score, pf.roles.values().next().value || role.toString());
            }
        }
        // Add role name and totalFiles to view
        return {
            ...view,
            role: role.toString(),
            totalFiles: Object.keys(this.fileScoresCache).length,
        };
    }
    /**
     * Get multi-role comparison view.
     */
    getMultiRoleView(roles, mergeStrategy = "max") {
        const fileScores = {};
        for (const [file, scores] of Object.entries(this.fileScoresCache)) {
            fileScores[file] = {};
            for (const r of Object.values(config_1.Role)) {
                fileScores[file][r] = scores[r] || 0.0;
            }
        }
        const view = priorityEngine_1.PriorityEngine.mergeMultiRoleView(roles, fileScores, this.dependencyGraph.imports, mergeStrategy);
        // Convert to result format
        const result = {
            primary: [],
            supporting: [],
            context: [],
        };
        for (const priority of ["primary", "supporting", "context"]) {
            result[priority] = view[priority].map((pf) => ({
                ...pf.toDict(),
                explanation: `Relevant to: ${Array.from(pf.roles)
                    .map((r) => r.toString())
                    .join(", ")}`,
            }));
        }
        return result;
    }
    /**
     * Trace data flow from a file.
     */
    traceFileFlow(startFile) {
        const flows = this.dependencyGraph.getAllDataFlows(startFile, 2);
        return {
            sourceFile: startFile,
            totalFilesInvolved: new Set(flows.flatMap((f) => f.path)).size,
            paths: flows.map((flow) => ({
                files: flow.path,
                confidence: flow.confidence,
            })),
        };
    }
    /**
     * Get detailed information about a file for a specific role.
     */
    getFileDetails(filePath, role) {
        const classification = this.classifier.classifyFile(filePath);
        const roleView = this.getRoleView(role);
        let priority = "hidden";
        for (const p of ["primary", "supporting", "context"]) {
            if (roleView[p].some((f) => f.filePath === filePath)) {
                priority = p;
                break;
            }
        }
        const dependencies = Array.from(this.dependencyGraph.imports[filePath] || new Set());
        const dependents = Array.from(this.dependencyGraph.importedBy?.[filePath] || new Set());
        const explanation = explanationEngine_1.ExplanationEngine.explainFileRelevance(filePath, role, this.fileScoresCache[filePath]?.[role] || 0, classification.primaryRole);
        // Get all roles where this file is relevant
        const fileScores = this.fileScoresCache[filePath] || {};
        const primaryRoles = Object.entries(fileScores)
            .filter(([_, score]) => score > 0.7)
            .map(([r, _]) => r);
        const supportingRoles = Object.entries(fileScores)
            .filter(([_, score]) => score > 0.4 && score <= 0.7)
            .map(([r, _]) => r);
        return {
            path: filePath,
            file: filePath,
            roleScore: this.fileScoresCache[filePath]?.[role] || 0,
            primaryRoles: primaryRoles.length > 0 ? primaryRoles : [classification.primaryRole],
            supportingRoles,
            explanation,
            dependencies,
            dependents,
        };
    }
    /**
     * Get repository overview for a role.
     */
    getRepositoryOverview(role) {
        const view = this.getRoleView(role);
        const totalFiles = Object.keys(this.fileScoresCache).length;
        const primaryCount = view.primary.length;
        const supportingCount = view.supporting.length;
        const contextCount = view.context.length;
        const keyFiles = view.primary.slice(0, 5).map((f) => ({
            path: f.filePath || f.path,
        }));
        const learningPath = this.generateLearningPath(role, view);
        const recommendations = this.generateRecommendations(role, view);
        const coverage = totalFiles > 0 ? (primaryCount + supportingCount) / totalFiles : 0;
        return {
            role: role.toString(),
            description: `${role} developer`,
            totalFiles,
            primaryCount,
            supportingCount,
            contextCount,
            keyFiles,
            learningPath,
            recommendations,
            coverage,
        };
    }
    /**
     * Generate learning path for a role.
     */
    generateLearningPath(role, view) {
        const keyFiles = view.primary.slice(0, 2).map((f) => f.filePath || f.path);
        const paths = {
            [config_1.Role.FRONTEND]: [
                "1. Explore UI components and pages",
                "2. Understand state management and hooks",
                `3. Review key files: ${keyFiles.join(", ")}`,
                "4. Learn styling and layout patterns",
                "5. Practice component composition",
            ],
            [config_1.Role.BACKEND]: [
                "1. Review API route definitions and endpoints",
                "2. Explore business logic in services",
                `3. Study key files: ${keyFiles.join(", ")}`,
                "4. Understand database interactions",
                "5. Learn error handling patterns",
            ],
            [config_1.Role.DEVOPS]: [
                "1. Review deployment configuration",
                "2. Explore infrastructure code",
                `3. Study key files: ${keyFiles.join(", ")}`,
                "4. Understand CI/CD pipelines",
                "5. Learn monitoring and logging setup",
            ],
            [config_1.Role.AI_ML]: [
                "1. Review model architecture",
                "2. Explore training logic",
                `3. Study key files: ${keyFiles.join(", ")}`,
                "4. Understand feature engineering",
                "5. Learn evaluation metrics",
            ],
            [config_1.Role.DATA]: [
                "1. Review data pipelines",
                "2. Explore database schemas",
                `3. Study key files: ${keyFiles.join(", ")}`,
                "4. Understand ETL processes",
                "5. Learn data validation",
            ],
            [config_1.Role.QA]: [
                "1. Review test coverage",
                "2. Explore test scenarios",
                `3. Study key files: ${keyFiles.join(", ")}`,
                "4. Understand validation logic",
                "5. Learn debugging techniques",
            ],
            [config_1.Role.SECURITY]: [
                "1. Review authentication and authorization",
                "2. Explore access control rules",
                `3. Study key files: ${keyFiles.join(", ")}`,
                "4. Understand security patterns",
                "5. Learn vulnerability prevention",
            ],
            [config_1.Role.FULL_STACK]: [
                "1. Understand full data flow from UI to database",
                "2. Explore API endpoints and services",
                `3. Study key files: ${keyFiles.join(", ")}`,
                "4. Learn component lifecycle",
                "5. Practice full-stack debugging",
            ],
        };
        return paths[role] || ["Start by reviewing core files"];
    }
    /**
     * Generate recommendations for a role.
     */
    generateRecommendations(role, view) {
        const recommendations = {
            [config_1.Role.FRONTEND]: [
                "Review component reusability and code sharing",
                "Consider state management libraries",
                "Implement responsive design patterns",
            ],
            [config_1.Role.BACKEND]: [
                "Optimize API response times",
                "Implement proper error handling",
                "Add comprehensive logging",
            ],
            [config_1.Role.DEVOPS]: [
                "Automate deployment processes",
                "Implement monitoring and alerting",
                "Ensure infrastructure as code",
            ],
            [config_1.Role.AI_ML]: [
                "Improve model accuracy and performance",
                "Document data preprocessing steps",
                "Track model versioning and experiments",
            ],
            [config_1.Role.DATA]: [
                "Optimize data pipeline efficiency",
                "Implement data quality checks",
                "Document data lineage",
            ],
            [config_1.Role.QA]: [
                "Expand test coverage",
                "Implement automated testing",
                "Document test scenarios",
            ],
            [config_1.Role.SECURITY]: [
                "Implement security best practices",
                "Regular vulnerability assessment",
                "Ensure compliance standards",
            ],
            [config_1.Role.FULL_STACK]: [
                "Maintain consistency across layers",
                "Optimize end-to-end performance",
                "Document architecture decisions",
            ],
        };
        return recommendations[role] || ["Review and optimize code quality"];
    }
    /**
     * Clear all caches.
     */
    clear() {
        this.classifier.clearCache();
        this.dependencyGraph.clear();
        this.fileScoresCache = {};
    }
}
exports.RoleViewsSystem = RoleViewsSystem;
/**
 * Factory function to create a system instance.
 */
function createSystem() {
    return new RoleViewsSystem();
}
//# sourceMappingURL=roleViews.js.map