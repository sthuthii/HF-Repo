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
