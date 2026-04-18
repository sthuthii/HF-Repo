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
    try {
      const res = await askQuestion(question);
      setAnswer(res);
    } catch (e: any) {
       setAnswer("Error asking question: " + e.message);
    }
    setLoading(false);
  };

  return (
    <Card title="Ask the Codebase">
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="e.g. Where is the authentication logic?"
        />
        <button onClick={handleAsk} disabled={loading || !question}>
          {loading ? "..." : "Send"}
        </button>
      </div>

      {(loading || answer) && (
        <div className="chat-bubble">
          {loading ? (
            <span className="thinking">Analyzing the repository...</span>
          ) : (
             <div style={{ whiteSpace: 'pre-wrap' }}>{answer}</div>
          )}
        </div>
      )}
    </Card>
  );
}