import { useState } from "react";
import type { FileData } from "../types";

export default function ImportantFiles({ files }: { files: FileData[] }) {
  const [topOnly, setTopOnly] = useState(false);
  const displayed = topOnly ? files.slice(0, 5) : files;
  return (
    <section className="section important-files">
      <h2>Important Files</h2>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        <input
          type="checkbox"
          checked={topOnly}
          onChange={() => setTopOnly(!topOnly)}
        />
        Top files only
      </label>
      <ul>
        {displayed.map((f) => (
          <li key={f.path} className="file-item">
            <span className="file-path">{f.path}</span>
            <span className="badge">⭐ {f.importance}</span>
            <p className="purpose">{f.purpose}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
