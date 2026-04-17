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
})();