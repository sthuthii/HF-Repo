/**
 * Demo script: Role-Aware Repository Views in TypeScript
 *
 * Shows how to use the system with a sample repository.
 */

import {
  createSystem,
  Role,
  FileClassifier,
  ExplanationEngine,
} from "./index";
import { ProductionOutput } from "./productionOutput";
import { RepositorySummaryGenerator } from "./repositorySummary";

// ============================================
// SAMPLE REPOSITORY
// ============================================

const SAMPLE_FILES: Record<string, string> = {
  "src/components/UserCard.tsx": `
import React, { useState } from 'react';
import { useUser } from '../hooks/useUser';
import './styles/card.css';

export const UserCard = ({ userId }: { userId: string }) => {
    const { user, loading } = useUser(userId);
    const [expanded, setExpanded] = useState(false);
    
    if (loading) return <div>Loading...</div>;
    
    return (
        <div className="user-card">
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <button onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Less' : 'More'}
            </button>
            {expanded && <p>{user.bio}</p>}
        </div>
    );
};
`,

  "src/api/userController.ts": `
import { Request, Response } from 'express';
import { User } from '../models/User';
import { AuthService } from '../services/AuthService';

export class UserController {
    async getUserById(req: Request, res: Response) {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true, data: user });
    }
    
    async createUser(req: Request, res: Response) {
        const { email, password } = req.body;
        const user = await User.create({ email, password });
        res.json({ success: true, data: user });
    }
}
`,

  "src/models/User.ts": `
import { Schema, model } from 'mongoose';

export interface IUser {
    _id?: string;
    name: string;
    email: string;
    password: string;
    bio?: string;
    createdAt?: Date;
}

const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export const User = model<IUser>('User', userSchema);
`,

  "src/services/AuthService.ts": `
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export class AuthService {
    private secret = process.env.JWT_SECRET || 'secret';
    
    async authenticate(email: string, password: string) {
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            throw new Error('Invalid credentials');
        }
        const token = jwt.sign({ userId: user._id }, this.secret);
        return { token, user };
    }
    
    async verifyToken(token: string) {
        return jwt.verify(token, this.secret);
    }
}
`,

  "src/middleware/auth.ts": `
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    const auth = new AuthService();
    const decoded = await auth.verifyToken(token);
    (req as any).user = decoded;
    next();
};
`,

  "src/hooks/useUser.ts": `
import { useState, useEffect } from 'react';

export const useUser = (userId: string) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetch(\`/api/users/\${userId}\`)
            .then(res => res.json())
            .then(data => {
                setUser(data.data);
                setLoading(false);
            });
    }, [userId]);
    
    return { user, loading };
};
`,

  "Dockerfile": `
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
`,

  "docker-compose.yml": `
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mongodb://mongo:27017
      - JWT_SECRET=secret
    depends_on:
      - mongo
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
`,

  "src/tests/userController.test.ts": `
import { UserController } from '../api/userController';
import { User } from '../models/User';

describe('UserController', () => {
    let controller: UserController;
    
    beforeEach(() => {
        controller = new UserController();
    });
    
    test('should return user by id', async () => {
        const mockUser = { _id: '1', name: 'John', email: 'john@example.com' };
        jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
        
        // Test assertions...
    });
});
`,
};

// ============================================
// DEMO FUNCTIONS
// ============================================

function demoFileClassification(): void {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 1: FILE CLASSIFICATION");
  console.log("=".repeat(60));

  const classifier = new FileClassifier();

  const testFiles = [
    "src/components/UserCard.tsx",
    "src/api/userController.ts",
    "src/services/AuthService.ts",
    "Dockerfile",
  ];

  for (const filePath of testFiles) {
    const content = SAMPLE_FILES[filePath] || "";
    const result = classifier.classifyFile(filePath, content);

    console.log(`\nFile: ${filePath}`);
    console.log(
      `Primary Role: ${result.primaryRole} (confidence: ${result.confidence.toFixed(2)})`
    );
    console.log("Scores:");

    const sortedScores = Object.entries(result.scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    for (const [role, score] of sortedScores) {
      console.log(`  ${role.padEnd(15)} ${score.toFixed(2)}`);
    }
  }
}

function demoRoleViews(): void {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 2: ROLE-BASED VIEWS");
  console.log("=".repeat(60));

  const system = createSystem();
  system.initializeRepository(SAMPLE_FILES);

  const rolesToTest = [Role.FRONTEND, Role.BACKEND, Role.DEVOPS];

  for (const role of rolesToTest) {
    console.log(`\n${"=".repeat(40)}`);
    console.log(`VIEW FOR: ${role.toUpperCase()}`);
    console.log("=".repeat(40));

    const view = system.getRoleView(role);

    for (const priority of ["primary", "supporting", "context"] as const) {
      const files = view[priority];
      console.log(`\n${priority.toUpperCase()} (${files.length} files):`);

      for (const pf of files.slice(0, 5)) {
        console.log(`  • ${pf.filePath}`);
        console.log(`    Score: ${pf.score.toFixed(2)}`);
        console.log(`    Why: ${pf.explanation}`);
      }
    }
  }
}

function demoDataFlowTracing(): void {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 3: DATA FLOW TRACING");
  console.log("=".repeat(60));

  const system = createSystem();
  system.initializeRepository(SAMPLE_FILES);

  const startFile = "src/components/UserCard.tsx";
  console.log(`\nTracing data flow from: ${startFile}`);

  const flows = system.traceFileFlow(startFile);

  console.log(`\nFound ${flows.totalFlows} potential flows:\n`);

  for (let i = 0; i < Math.min(flows.flows?.length ?? 0, 2); i++) {
    const flow = flows.flows?.[i];
    if (!flow) continue;
    
    console.log(
      `Flow ${i + 1} (Confidence: ${(flow.confidence * 100).toFixed(0)}%):`
    );

    for (let j = 0; j < flow.path.length; j++) {
      const file = flow.path[j];
      console.log(`  ${j + 1}. [${file}]`);
      if (j < flow.path.length - 1) {
        console.log(`     → ${flow.steps[j + 1] || "imports"}`);
      }
    }
    console.log();
  }
}

function demoMultiRoleComparison(): void {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 4: MULTI-ROLE COMPARISON");
  console.log("=".repeat(60));

  const system = createSystem();
  system.initializeRepository(SAMPLE_FILES);

  const roles = [Role.FRONTEND, Role.BACKEND];
  console.log(`\nComparing roles: ${roles.join(", ")}`);

  const view = system.getMultiRoleView(roles);

  console.log("\nPRIMARY FILES (relevant to at least one role):");
  for (const fileInfo of view.primary.slice(0, 5)) {
    console.log(`  • ${fileInfo.file}`);
    console.log(`    ${fileInfo.explanation}`);
  }
}

function demoFileDetails(): void {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 5: FILE DETAILS");
  console.log("=".repeat(60));

  const system = createSystem();
  system.initializeRepository(SAMPLE_FILES);

  const filePath = "src/api/userController.ts";
  const role = Role.BACKEND;

  const details = system.getFileDetails(filePath, role);

  console.log(`\nFile: ${details.file}`);
  console.log(`Primary Role: ${details.primaryRole}`);
  console.log(`Priority: ${details.priority}`);
  console.log(`\nExplanation:\n  ${details.explanation}`);
  console.log(`\nDependencies (${details.dependencies.length} total):`);

  for (const dep of details.dependencies.slice(0, 5)) {
    console.log(`  • ${dep}`);
  }
}

function demoRepositoryOverview(): void {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 6: REPOSITORY OVERVIEW");
  console.log("=".repeat(60));

  const system = createSystem();
  system.initializeRepository(SAMPLE_FILES);

  const rolesToTest = [Role.BACKEND, Role.FRONTEND, Role.DEVOPS];

  for (const role of rolesToTest) {
    const overview = system.getRepositoryOverview(role);

    console.log(`\n${overview.description}`);
    console.log(`  Total Files: ${overview.totalFiles}`);
    console.log(`  Primary: ${overview.primaryCount}`);
    console.log(`  Supporting: ${overview.supportingCount}`);
    console.log(`  Context: ${overview.contextCount}`);
    console.log(`  Recommendation: ${overview.recommendation}`);
  }
}

function demoPromptTemplates(): void {
  console.log("\n" + "=".repeat(60));
  console.log("DEMO 7: LLM PROMPT TEMPLATES");
  console.log("=".repeat(60));

  const fileContent = SAMPLE_FILES["src/api/userController.ts"];

  const prompt1 = ExplanationEngine.summarizeFileForRole(
    fileContent,
    Role.BACKEND,
    "src/api/userController.ts"
  );

  console.log("\nPrompt Template 1: Summarize for Backend");
  console.log("-".repeat(40));
  console.log(prompt1);

  console.log("\n[Example LLM Response]:");
  console.log(
    "This controller handles user CRUD operations with two main methods: getUserById"
  );
  console.log(
    "retrieves a user by ID from the database and returns a 404 if not found, while"
  );
  console.log(
    "createUser accepts email and password in the request body to create a new user"
  );
  console.log(
    "record. Both methods return JSON responses with success status and data payload."
  );

  const prompt2 = ExplanationEngine.explainDataFlow(
    ["UserCard.tsx", "api/index.ts", "userController.ts", "User.ts"],
    "UserCard.tsx",
    "User.ts"
  );

  console.log("\nPrompt Template 2: Explain Data Flow");
  console.log("-".repeat(40));
  console.log(prompt2);

  console.log("\n[Example LLM Response]:");
  console.log(
    "UserCard renders user data by calling useUser hook, which calls the API endpoint"
  );
  console.log(
    "in api/index.ts, forwarding the request to userController.ts that queries the User"
  );
  console.log(
    "model to fetch data from the database, then returns the user object through the"
  );
  console.log("call chain back to the component for rendering.");
}

// ============================================
// MAIN
// ============================================

function main(): void {
  console.log("\n");
  console.log("=".repeat(60));
  console.log(
    " ROLE-AWARE INTELLIGENT REPOSITORY VIEWS DEMO (TypeScript) ".padEnd(60)
  );
  console.log("=".repeat(60));

  demoFileClassification();
  demoRoleViews();
  demoDataFlowTracing();
  demoMultiRoleComparison();
  demoFileDetails();
  demoRepositoryOverview();
  demoPromptTemplates();
  demoProductionOutput();

  console.log("\n" + "=".repeat(60));
  console.log("DEMO COMPLETE");
  console.log("=".repeat(60) + "\n");
}

// Run if this is the main module
if (require.main === module) {
  main();
}

/**
 * Demo: Production output layer transformation
 */
function demoProductionOutput() {
  console.log("\n" + "=".repeat(60));
  console.log("PRODUCTION OUTPUT LAYER DEMO");
  console.log("=".repeat(60) + "\n");

  try {
    const system = createSystem();
    const classifier = new FileClassifier();

    // Classify some files
    const testFiles = [
      { path: "src/api/server.ts", content: SAMPLE_FILES["src/api/userController.ts"] },
      { path: "src/components/UI.tsx", content: SAMPLE_FILES["src/components/UserCard.tsx"] },
      { path: "package.json", content: '{"name": "app", "version": "1.0.0"}' },
    ];

    const results = testFiles.map((file) => {
      const result = classifier.classifyFile(file.path, file.content);
      console.log(`Classified ${file.path}: ${result.primaryRole} (${(result.confidence * 100).toFixed(1)}%)`);
      return result;
    });

    // Transform with production output
    const output = ProductionOutput.transform({
      classificationResults: results,
      rawDependencies: {
        "src/api/server.ts": "express, cors, ./config",
        "src/components/UI.tsx": "react, lodash",
        "package.json": "",
      },
      mockTestAccuracy: 0.95,
    });

    console.log("\n📊 PRODUCTION OUTPUT:\n");
    console.log(output.formattedOutput);
    console.log(output.healthReport);
    console.log(output.issuesReport);
    console.log(output.repositorySummary);
  } catch (error) {
    console.log("Note: Production output demo requires full system setup");
  }
}

export { main, SAMPLE_FILES };
