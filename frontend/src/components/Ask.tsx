import { useState } from "react";
import { askQuestion } from "../services/api";
import Card from "./Card";

export default function Ask() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question) return;

    setLoading(true);
    const res = await askQuestion(question);
    setAnswer(res);
    setLoading(false);
  };

  return (
    <Card title="Ask Repo">
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask anything..."
        className="border p-2 w-full"
      />

      <button
        onClick={handleAsk}
        className="mt-2 bg-black text-white px-4 py-2 rounded"
      >
        Ask
      </button>

      <div className="mt-3">
        {loading ? <p>Thinking...</p> : <p>{answer}</p>}
      </div>
    </Card>
  );
}