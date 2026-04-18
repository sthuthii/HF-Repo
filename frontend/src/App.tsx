import { useState } from "react";
import RepoInput from "./components/RepoInput";
import Summary from "./components/Summary";
import StartHere from "./components/StartHere.tsx";
import ImportantFiles from "./components/ImportantFiles.tsx";
import ChatUI from "./components/ChatUI.tsx";
import FlowExplanation from "./components/FlowExplanation.tsx";
import type { RepoData } from "./types";

export default function App() {
  const [repoData, setRepoData] = useState<RepoData | null>(null);

  const handleData = (data: RepoData) => {
    setRepoData(data);
  };
  return (
    <div className="app-container">
      <header className="header">
        <h1 className="text-gradient">Codebase Explorer</h1>
        <p>Understand any repository in under 2 minutes</p>
      </header>
      <main className="dashboard-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <RepoInput onData={handleData} />
          {repoData && (
            <>
              <Summary summary={repoData.summary} />
              <StartHere entryPoints={repoData.summary.entryPoints} />
              <ImportantFiles files={repoData.topFiles} />
              {repoData.flow && <FlowExplanation flow={repoData.flow} />}
              <ChatUI repoId={repoData.id} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}