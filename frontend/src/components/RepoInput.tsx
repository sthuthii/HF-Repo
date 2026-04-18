import { useState } from "react";
import { analyzeRepo } from "../services/api";
import type { RepoData } from "../types";

export default function RepoInput({ onData }: { onData: (data: RepoData) => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const handleAnalyze = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const data = await analyzeRepo(url);
      onData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="repo-input">
      <input
        type="text"
        placeholder="GitHub repository URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="input"
      />
      <button onClick={handleAnalyze} disabled={loading} className="btn">
        {loading ? "Analyzing repo…" : "Analyze"}
      </button>
    </div>
  );
}
