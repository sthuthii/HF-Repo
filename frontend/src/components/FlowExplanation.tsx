import type { RepoData } from "../types";

export default function FlowExplanation({ flow }: { flow: string }) {
  return (
    <section className="section flow-explanation">
      <h2>Basic Flow</h2>
      <pre>{flow}</pre>
    </section>
  );
}
