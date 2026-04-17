#!/usr/bin/env python3
"""
Demo script: Role-Aware Repository Views in action.

Shows how to use the system with a sample repository.
"""

import sys
import io
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Add parent directory to path so repomap_roles can be imported
sys.path.insert(0, str(Path(__file__).parent.parent))

import json
from repomap_roles import (
    create_system, Role, FileClassifier, RoleViewsSystem,
    PromptTemplates, OptimizationStrategy
)


# ============================================
# SAMPLE REPOSITORY
# ============================================

SAMPLE_FILES = {
    "src/components/UserCard.tsx": """
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
""",
    
    "src/api/userController.ts": """
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
""",
    
    "src/models/User.ts": """
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
""",
    
    "src/services/AuthService.ts": """
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
""",
    
    "src/middleware/auth.ts": """
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
""",
    
    "src/hooks/useUser.ts": """
import { useState, useEffect } from 'react';

export const useUser = (userId: string) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetch(`/api/users/${userId}`)
            .then(res => res.json())
            .then(data => {
                setUser(data.data);
                setLoading(false);
            });
    }, [userId]);
    
    return { user, loading };
};
""",
    
    "Dockerfile": """
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
""",
    
    "docker-compose.yml": """
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
""",
    
    "src/tests/userController.test.ts": """
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
""",
}


# ============================================
# DEMO FUNCTIONS
# ============================================

def demo_file_classification():
    """Demo 1: Classify files and compute role scores."""
    print("\n" + "="*60)
    print("DEMO 1: FILE CLASSIFICATION")
    print("="*60)
    
    classifier = FileClassifier()
    
    # Classify a few files
    test_files = [
        "src/components/UserCard.tsx",
        "src/api/userController.ts",
        "src/services/AuthService.ts",
        "Dockerfile",
    ]
    
    for file_path in test_files:
        content = SAMPLE_FILES.get(file_path, "")
        result = classifier.classify_file(file_path, content)
        
        print(f"\nFile: {file_path}")
        print(f"Primary Role: {result['primary_role']} (confidence: {result['confidence']:.2f})")
        print("Scores:")
        for role, score in sorted(result['scores'].items(), key=lambda x: x[1], reverse=True)[:3]:
            print(f"  {role:15} {score:.2f}")


def demo_role_views():
    """Demo 2: Generate role-specific views."""
    print("\n" + "="*60)
    print("DEMO 2: ROLE-BASED VIEWS")
    print("="*60)
    
    system = create_system()
    system.initialize_repository(SAMPLE_FILES)
    
    roles_to_test = [Role.FRONTEND, Role.BACKEND, Role.DEVOPS]
    
    for role in roles_to_test:
        print(f"\n{'='*40}")
        print(f"VIEW FOR: {role.value.upper()}")
        print(f"{'='*40}")
        
        view = system.get_role_view(role)
        
        for priority in ['primary', 'supporting', 'context']:
            files = view.get(priority, [])
            print(f"\n{priority.upper()} ({len(files)} files):") 
            for file_info in files[:5]:
                print(f"  • {file_info['file']}")
                print(f"    Score: {file_info['score']:.2f}")
                print(f"    Why: {file_info['explanation']}")


def demo_data_flow_tracing():
    """Demo 3: Trace data flow."""
    print("\n" + "="*60)
    print("DEMO 3: DATA FLOW TRACING")
    print("="*60)
    
    system = create_system()
    system.initialize_repository(SAMPLE_FILES)
    
    start_file = "src/components/UserCard.tsx"
    print(f"\nTracing data flow from: {start_file}")
    
    flows = system.trace_file_flow(start_file)
    
    print(f"\nFound {flows['total_flows']} potential flows:\n")
    
    for i, flow in enumerate(flows['flows'][:2], 1):
        print(f"Flow {i} (Confidence: {flow['confidence']:.0%}):")
        for j, (file, step) in enumerate(zip(flow['path'], flow['steps']), 1):
            print(f"  {j}. [{file}]")
            print(f"     → {step}")
        print()


def demo_multi_role_comparison():
    """Demo 4: Compare multiple roles."""
    print("\n" + "="*60)
    print("DEMO 4: MULTI-ROLE COMPARISON")
    print("="*60)
    
    system = create_system()
    system.initialize_repository(SAMPLE_FILES)
    
    roles = [Role.FRONTEND, Role.BACKEND]
    print(f"\nComparing roles: {', '.join([r.value for r in roles])}")
    
    view = system.get_multi_role_view(roles)
    
    print("\nPRIMARY FILES (relevant to at least one role):")
    for file_info in view['primary'][:5]:
        relevant_roles = ', '.join(file_info.get('roles', []))
        print(f"  • {file_info['file']}")
        print(f"    Relevant to: {relevant_roles}")


def demo_file_details():
    """Demo 5: Get detailed file information."""
    print("\n" + "="*60)
    print("DEMO 5: FILE DETAILS")
    print("="*60)
    
    system = create_system()
    system.initialize_repository(SAMPLE_FILES)
    
    file_path = "src/api/userController.ts"
    role = Role.BACKEND
    
    details = system.get_file_details(file_path, role)
    
    print(f"\nFile: {details['file']}")
    print(f"Primary Role: {details['primary_role']}")
    print(f"Priority: {details['priority'].upper()}")
    print(f"\nExplanation:")
    print(f"  {details['explanation']}")
    print(f"\nDependencies ({len(details['dependencies'])} total):")
    for dep in details['dependencies'][:3]:
        print(f"  • {dep}")


def demo_repository_overview():
    """Demo 6: Repository overview for a role."""
    print("\n" + "="*60)
    print("DEMO 6: REPOSITORY OVERVIEW")
    print("="*60)
    
    system = create_system()
    system.initialize_repository(SAMPLE_FILES)
    
    for role in [Role.BACKEND, Role.FRONTEND, Role.DEVOPS]:
        overview = system.get_repository_overview(role)
        
        print(f"\n{overview['description']}")
        print(f"  Total Files: {overview['total_files']}")
        print(f"  Primary: {overview['file_breakdown']['primary']}")
        print(f"  Supporting: {overview['file_breakdown']['supporting']}")
        print(f"  Context: {overview['file_breakdown']['context']}")
        print(f"  Recommendation: {overview['recommendation']}")


def demo_prompt_templates():
    """Demo 7: LLM prompt templates with example outputs."""
    print("\n" + "="*60)
    print("DEMO 7: LLM PROMPT TEMPLATES")
    print("="*60)
    
    # Example 1: File summary prompt
    prompt1 = PromptTemplates.summarize_file_for_role(
        SAMPLE_FILES["src/api/userController.ts"],
        "backend"
    )
    print("\nPrompt Template 1: Summarize for Backend")
    print("-" * 40)
    print(prompt1)
    print("\n[Example LLM Response]:")
    print("This controller handles user CRUD operations with two main methods: getUserById")
    print("retrieves a user by ID from the database and returns a 404 if not found, while")
    print("createUser accepts email and password in the request body to create a new user")
    print("record. Both methods return JSON responses with success status and data payload.")
    
    # Example 2: Data flow explanation
    prompt2 = PromptTemplates.explain_data_flow(
        ["UserCard.tsx", "api/index.ts", "userController.ts", "User.ts"],
        "UserCard.tsx",
        "User.ts"
    )
    print("\nPrompt Template 2: Explain Data Flow")
    print("-" * 40)
    print(prompt2)
    print("\n[Example LLM Response]:")
    print("UserCard renders user data by calling useUser hook, which calls the API endpoint")
    print("in api/index.ts, forwarding the request to userController.ts that queries the User")
    print("model to fetch data from the database, then returns the user object through the")
    print("call chain back to the component for rendering.")


def demo_optimization():
    """Demo 8: Performance optimization."""
    print("\n" + "="*60)
    print("DEMO 8: OPTIMIZATION STRATEGIES")
    print("="*60)
    
    # Simulate file changes
    old_hashes = {f: "hash1" for f in SAMPLE_FILES.keys()}
    new_files = SAMPLE_FILES.copy()
    new_files["src/components/NewComponent.tsx"] = "// new file"
    
    changes = OptimizationStrategy.detect_changed_files(old_hashes, new_files)
    
    print(f"\nFile Changes Detected:")
    print(f"  Added: {len(changes['added'])}")
    print(f"  Modified: {len(changes['modified'])}")
    print(f"  Deleted: {len(changes['deleted'])}")
    print(f"  Total Changes: {changes['total_changes']}")
    
    # Performance metrics
    metrics = OptimizationStrategy.PerformanceMetrics()
    metrics.record_timing("role_view", 45.2)
    metrics.record_timing("role_view", 42.8)
    metrics.record_timing("trace_flow", 120.5)
    # Only set cache metrics if LLM calls would be made
    # metrics.cache_hits = 150
    # metrics.cache_misses = 50
    # metrics.llm_calls = 10  # Uncomment when LLM integration is added
    
    stats = metrics.get_stats()
    print(f"\nPerformance Metrics:")
    if stats['total_llm_calls'] > 0:
        print(f"  Cache Hit Rate: {stats['cache_hit_rate']:.1%}")
        print(f"  Total LLM Calls: {stats['total_llm_calls']}")
    else:
        print(f"  Total LLM Calls: {stats['total_llm_calls']} (no caching in this demo)")
    for op, timings in stats.items():
        if op not in ['cache_hit_rate', 'total_llm_calls']:
            print(f"  {op}: avg {timings['avg_ms']:.1f}ms")


def main():
    """Run all demos."""
    print("\n")
    print("=" * 60)
    print(" ROLE-AWARE INTELLIGENT REPOSITORY VIEWS DEMO ".center(60))
    print("=" * 60)
    
    demo_file_classification()
    demo_role_views()
    demo_data_flow_tracing()
    demo_multi_role_comparison()
    demo_file_details()
    demo_repository_overview()
    demo_prompt_templates()
    demo_optimization()
    
    print("\n" + "="*60)
    print("DEMO COMPLETE")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
