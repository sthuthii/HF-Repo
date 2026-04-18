import { useState } from "react";
import { fetchChat } from "../services/api";

export default function ChatUI({ repoId }: { repoId: string }) {
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const answer = await fetchChat(repoId, input);
      setMessages((m) => [...m, { role: "assistant", text: answer }]);
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", text: "Error: " + (e as any).message }]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <section className="section chat-ui">
      <h2>Ask a Question</h2>
      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "msg user" : "msg bot"}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="msg bot">Thinking…</div>}
      </div>
      <div className="chat-input" style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the repo…"
          disabled={loading}
          className="input"
        />
        <button onClick={send} disabled={loading || !input} className="btn">
          Send
        </button>
      </div>
    </section>
  );
}
