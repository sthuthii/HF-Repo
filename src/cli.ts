#!/usr/bin/env node

import "dotenv/config";

const args = process.argv.slice(2);

(async () => {
  const cmd = args[0];

  if (cmd === "init") {
    const { initRepo } = await import("./init");
    await initRepo(args[1]);
  }

  if (cmd === "summary") {
    const { getSummary } = await import("./summary");
    console.log(getSummary());
  }

  if (cmd === "files") {
    const { listFiles } = await import("./files");
    console.table(listFiles());
  }

  if (cmd === "ask") {
    const { ask } = await import("./ask");
    const q = args.slice(1).join(" ");
    console.log(await ask(q));
  }

  // Role Analysis Commands
  if (cmd === "role") {
    const {
      getRoleAnalysis,
      printRoleView,
    } = await import("./roleAnalysis");
    const roleArg = args[1];

    if (!roleArg) {
      console.log("Usage: npm run dev role <role>");
      console.log("Roles: frontend, backend, full-stack, devops, ai-ml, data, qa, security");
      process.exit(1);
    }

    try {
      const view = await getRoleAnalysis(roleArg);
      printRoleView(view);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  if (cmd === "analyze") {
    const {
      getRepositoryOverview,
      printRepositoryOverview,
    } = await import("./roleAnalysis");
    const roleArg = args[1];

    if (!roleArg) {
      console.log("Usage: npm run dev analyze <role>");
      console.log("Roles: frontend, backend, full-stack, devops, ai-ml, data, qa, security");
      process.exit(1);
    }

    try {
      const overview = await getRepositoryOverview(roleArg);
      printRepositoryOverview(overview);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  if (cmd === "flow") {
    const { traceDataFlow, printDataFlow } = await import("./roleAnalysis");
    const filePath = args[1];

    if (!filePath) {
      console.log("Usage: npm run dev flow <file-path>");
      process.exit(1);
    }

    try {
      const flow = await traceDataFlow(filePath);
      printDataFlow(flow);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  if (cmd === "file-details") {
    const { getFileRoleDetails, printFileDetails } = await import("./roleAnalysis");
    const filePath = args[1];
    const roleArg = args[2];

    if (!filePath || !roleArg) {
      console.log("Usage: npm run dev file-details <file-path> <role>");
      console.log("Roles: frontend, backend, full-stack, devops, ai-ml, data, qa, security");
      process.exit(1);
    }

    try {
      const details = await getFileRoleDetails(filePath, roleArg);
      printFileDetails(details);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  if (cmd === "help" || cmd === "--help" || cmd === "-h" || !cmd) {
    console.log(`
🗺️  Repomap - Repository Analysis Tool

Commands:
  init <url>                    Clone and analyze a repository
  summary                       Display repository summary
  files                         List all analyzed files
  ask <question>               Ask a question about the repository
  
Role Analysis:
  role <role>                   Get role-specific file view
  analyze <role>                Get repository overview for role
  flow <file-path>              Trace data flow through files
  file-details <path> <role>    Get detailed info for file in role context
  
  Supported Roles:
    - frontend       (UI/React/Vue components)
    - backend        (API routes, business logic)
    - full-stack     (End-to-end features)
    - devops         (Docker, CI/CD, infrastructure)
    - ai-ml          (Machine learning models)
    - data           (Data processing, analytics)
    - qa             (Testing, quality assurance)
    - security       (Authentication, authorization)

Examples:
  npm run dev init https://github.com/user/repo.git
  npm run dev role frontend
  npm run dev analyze backend
  npm run dev flow src/api/handler.ts
  npm run dev file-details src/App.tsx frontend
    `);
  }
})();