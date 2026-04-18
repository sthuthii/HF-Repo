import type { SummaryData } from "../types";
import Card from "./Card";

export default function Summary({ summary }: { summary: SummaryData }) {
  return (
    <Card title="Repository Summary">
      <p>{summary.description}</p>
      <h3>Tech Stack</h3>
      <ul>
        {summary.techStack.map((tech) => (
          <li key={tech}>⚙️ {tech}</li>
        ))}
      </ul>
    </Card>
  );
}
