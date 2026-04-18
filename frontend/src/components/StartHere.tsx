import type { SummaryData } from "../types";

export default function StartHere({ entryPoints }: { entryPoints: string[] }) {
  return (
    <section className="section start-here">
      <h2>Start Here</h2>
      <ul>
        {entryPoints.map((file) => (
          <li key={file}>📄 {file}</li>
        ))}
      </ul>
    </section>
  );
}
