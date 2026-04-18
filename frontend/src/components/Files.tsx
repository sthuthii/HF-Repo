import { useEffect, useState } from "react";
import { fetchFiles } from "../services/api";
import type { FileData } from "../types";
import Card from "./Card";

export default function Files() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles()
      .then(setFiles)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <Card title="Files">
        <p className="text-red-500">Error: {error}</p>
      </Card>
    );
  }

  return (
    <Card title="Files">
      {!Array.isArray(files) || files.length === 0 ? (
        <p>Loading...</p>
      ) : (
        files.slice(0, 10).map((file) => (
          <div key={file.path} className="mb-2">
            <b>{file.path}</b> ({file.importance})
            <p>{file.purpose}</p>
          </div>
        ))
      )}
    </Card>
  );
}
