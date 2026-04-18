#!/usr/bin/env node

import "dotenv/config";
import { DEFAULT_REPO } from "./db";

interface ParsedArgs {
  positional: string[];
  flags: Record<string, string>;
}

// NEW: multi-repo support
function parseArgs(args: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const value = args[i];
    if (value.startsWith("--")) {
      const flagName = value.slice(2);
      const nextValue = args[i + 1];
      if (nextValue && !nextValue.startsWith("--")) {
        flags[flagName] = nextValue;
        i++;
      } else {
        flags[flagName] = "true";
      }
      continue;
    }

    positional.push(value);
  }

  return { positional, flags };
}

(async () => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const cmd = positional[0];

  if (cmd === "init") {
    const repoArg = positional[1];
    const repoName = flags.name ?? DEFAULT_REPO;

    if (!repoArg) {
      console.error("Usage: npm run dev -- init <local-path|git-url> [--name <repo>]");
      process.exit(1);
    }

    const { initRepo } = await import("./init");
    await initRepo(repoArg, repoName);
    return;
  }

  if (cmd === "summary") {
    const repoName = flags.repo ?? DEFAULT_REPO;
    const { initDB } = await import("./db");
    await initDB();
    const { getSummary } = await import("./summary");
    console.log(getSummary(repoName));
    return;
  }

  if (cmd === "files") {
    const repoName = flags.repo ?? DEFAULT_REPO;
    const { initDB } = await import("./db");
    await initDB();
    const { listFiles } = await import("./files");
    console.table(listFiles(repoName));
    return;
  }

  if (cmd === "ask") {
    const repoName = flags.repo ?? DEFAULT_REPO;
    const { initDB } = await import("./db");
    await initDB();
    const { ask } = await import("./ask");
    const q = positional.slice(1).join(" ");
    if (!q) {
      console.error("Usage: npm run dev -- ask <question> [--repo <repo>]");
      process.exit(1);
    }
    console.log(await ask(q, repoName));
    return;
  }

  console.error("Usage: npm run dev -- <init|summary|files|ask> ...");
  process.exit(1);
})();
