import { useEffect, useState } from "react";
import { fetchSummary } from "../services/api";
import type { SummaryData } from "../types";
import Card from "./Card";

export default function Summary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <Card title="Summary">
        <p className="text-red-500">Error: {error}</p>
      </Card>
    );
  }

  return (
    <Card title="Summary">
      {!data ? (
        <p>Loading...</p>
      ) : (
        <>
          <p>Total Files: {data.total}</p>
          {(data.topFiles ?? []).map((file) => (
            <div key={file.path}>
              <b>{file.path}</b>
              <p>{file.purpose}</p>
            </div>
          ))}
        </>
      )}
    </Card>
  );
}
