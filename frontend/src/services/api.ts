import type { FileData, SummaryData, RepoData } from "../types";

const BASE_URL = "http://localhost:3000";

// Analyze repository: expects backend to accept POST /analyze with { url }
export async function analyzeRepo(url: string): Promise<RepoData> {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Failed to analyze repo: ${res.statusText} ${err}`);
  }
  const data = await res.json();
  // Expect shape { id, summary, topFiles, flow? }
  return data as RepoData;
}

export async function fetchSummary(): Promise<SummaryData> {
  const res = await fetch(`${BASE_URL}/summary`);
  if (!res.ok) throw new Error(`Failed to fetch summary: ${res.statusText}`);
  const data = await res.json();
  return data.summary as SummaryData;
}

export async function fetchFiles(): Promise<FileData[]> {
  const res = await fetch(`${BASE_URL}/files`);
  if (!res.ok) throw new Error(`Failed to fetch files: ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// Chat endpoint expects repoId in path
export async function fetchChat(repoId: string, question: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/${repoId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error ?? `Failed to ask question: ${res.statusText}`);
  }
  const data = await res.json();
  return data.answer;
}

// Preserve original askQuestion for backward compatibility (calls fetchChat without repoId)
export async function askQuestion(question: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error ?? `Failed to ask question: ${res.statusText}`);
  }
  const data = await res.json();
  return data.answer;
}
