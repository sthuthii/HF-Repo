import type { FileData, SummaryData } from "../types";

const BASE_URL = "http://localhost:3000";

export async function fetchSummary(): Promise<SummaryData> {
  const res = await fetch(`${BASE_URL}/summary`);
  if (!res.ok) throw new Error(`Failed to fetch summary: ${res.statusText}`);
  const data = await res.json();
  const summary = data?.summary;

  return {
    total: typeof summary?.total === "number" ? summary.total : 0,
    topFiles: Array.isArray(summary?.topFiles) ? summary.topFiles : [],
  };
}

export async function fetchFiles(): Promise<FileData[]> {
  const res = await fetch(`${BASE_URL}/files`);
  if (!res.ok) throw new Error(`Failed to fetch files: ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function askQuestion(question: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Failed to ask question: ${res.statusText}`);
  }

  const data = await res.json();
  return data.answer;
}
