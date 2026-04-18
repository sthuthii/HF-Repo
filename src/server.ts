const express = require("express");
const cors = require("cors");
const path = require("path");

const { DEFAULT_REPO, initDB } = require("./db");
const { getSummary } = require("./summary");
const { listFiles } = require("./files");
const { ask } = require("./ask");

const app = express();
const PORT = 3000;

// NEW: multi-repo support
function normalizeRepoName(repo: unknown) {
  return typeof repo === "string" && repo.trim() ? repo.trim() : DEFAULT_REPO;
}

app.use(cors());
app.use(express.json());

app.get("/summary", async (req: any, res: any) => {
  try {
    const repo = normalizeRepoName(req.query?.repo);
    const summary = getSummary(repo);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: "Failed to get summary" });
  }
});

app.get("/files", async (req: any, res: any) => {
  try {
    const repo = normalizeRepoName(req.query?.repo);
    const files = listFiles(repo);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: "Failed to get files" });
  }
});

app.post("/ask", async (req: any, res: any) => {
  try {
    const question = req.body?.question;
    const repo = normalizeRepoName(req.body?.repo);

    if (typeof question !== "string" || question.trim() === "") {
      return res.status(400).json({ error: "Question is required" });
    }

    const answer = await ask(question, repo);
    res.json({ answer });
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? "Failed to answer question" });
  }
});

app.post("/analyze", async (req: any, res: any) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    let repoName = url;
    if (/^(https?:\/\/|git@|ssh:\/\/)/.test(url) || url.endsWith(".git")) {
        repoName = url.split("/").pop()?.replace(/\.git$/, "") || "repo";
    }

    try {
      const { initRepo } = require("./init");
      await initRepo(url, repoName);
    } catch(err: any) {
      console.error("Analysis initialization info:", err.message);
    }

    const [descResponse, techResponse, entryResponse, flowResponse] = await Promise.all([
      ask("Provide a detailed 2 to 3 sentence description of what this entire repository does.", repoName),
      ask("List the top 5 main technologies, programming languages, and frameworks used in this codebase. Reply ONLY with a comma-separated list.", repoName),
      ask("What are the 3 most important root entry point files? Reply ONLY with a comma-separated list of filenames.", repoName),
      ask("Explain briefly how data and control logic typically flow through the main architecture of this project.", repoName)
    ]);

    const { getSummary } = require("./summary");
    const summaryData = getSummary(repoName);
    const topFiles = summaryData.topFiles || [];

    res.json({
      id: repoName,
      summary: {
         description: descResponse,
         techStack: techResponse.split(",").map((s: string) => s.trim()).filter(Boolean),
         entryPoints: entryResponse.split(",").map((s: string) => s.trim()).filter(Boolean),
      },
      topFiles: topFiles,
      flow: flowResponse
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error?.message ?? "Failed to analyze repo" });
  }
});

app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.use((req: any, res: any) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

async function startServer() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
