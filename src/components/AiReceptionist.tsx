import { useState } from "react";
import { getDeviceId } from "../utils/deviceId";
import "../styles/AiReceptionist.css";

interface ToolSummary {
  id: string;
  title: string;
  desc: string;
  category: string;
}

interface AiReceptionistProps {
  tools: ToolSummary[];
  onNavigate: (toolId: string) => void;
}

export default function AiReceptionist({ tools, onNavigate }: AiReceptionistProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [matchedToolId, setMatchedToolId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAsk = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setReply(null);
    setMatchedToolId(null);
    setErrorMsg("");

    try {
      const response = await fetch("/api/receptionist", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
        body: JSON.stringify({ message, tools })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || "Something went wrong. Please try again.");
        return;
      }

      setReply(data.reply);
      setMatchedToolId(data.toolId);
    } catch (error) {
      console.error("Receptionist request failed:", error);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="receptionist-card">
      <h3 className="receptionist-title">👋 Not sure where to start?</h3>
      <p className="receptionist-subtitle">Tell me what you're trying to do, and I'll point you to the right tool.</p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="e.g. I need to clean up a messy ChatGPT response before pasting it into an email..."
        className="textarea-input"
        style={{ height: "80px", marginTop: "12px" }}
      />

      <button
        onClick={handleAsk}
        disabled={!message.trim() || isLoading}
        className="btn-generate"
      >
        {isLoading ? "⏳ Thinking..." : "Ask the Receptionist"}
      </button>

      {errorMsg && <p className="receptionist-error">{errorMsg}</p>}

      {reply && (
        <div className="receptionist-reply">
          <p>{reply}</p>
          {matchedToolId && (
            <button className="btn-generate" onClick={() => onNavigate(matchedToolId)}>
              Take Me There →
            </button>
          )}
        </div>
      )}
    </div>
  );
}