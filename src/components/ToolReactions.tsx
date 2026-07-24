import { useEffect, useState } from "react";
import { getDeviceId } from "../utils/deviceId";
import "../styles/ToolReactions.css";

interface ToolReactionsProps {
  toolId: string;
}

type ReactionType = "like" | "dislike" | "heart";

export default function ToolReactions({ toolId }: ToolReactionsProps) {
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [hearts, setHearts] = useState(0);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReactions = async () => {
      try {
        const res = await fetch(`/api/tool-reactions?toolId=${toolId}`, {
          headers: { "X-Device-Id": getDeviceId() }
        });
        const data = await res.json();
        if (res.ok) {
          setLikes(data.likes);
          setDislikes(data.dislikes);
          setHearts(data.hearts);
          setUserReaction(data.userReaction);
        }
      } catch (err) {
        console.error("Failed to fetch reactions:", err);
      }
    };
    fetchReactions();
  }, [toolId]);

  const handleReaction = async (reaction: ReactionType) => {
    if (loading) return;
    setLoading(true);

    const newReaction = userReaction === reaction ? null : reaction;

    try {
      const res = await fetch("/api/tool-reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
        body: JSON.stringify({ toolId, reaction: newReaction })
      });
      const data = await res.json();
      if (res.ok) {
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setHearts(data.hearts);
        setUserReaction(data.userReaction);
      }
    } catch (err) {
      console.error("Failed to update reaction:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-reactions">
      <button
        className={`reaction-btn ${userReaction === "like" ? "reaction-active" : ""}`}
        onClick={() => handleReaction("like")}
        disabled={loading}
      >
        👍 <span>{likes}</span>
      </button>
      <button
        className={`reaction-btn ${userReaction === "dislike" ? "reaction-active" : ""}`}
        onClick={() => handleReaction("dislike")}
        disabled={loading}
      >
        👎 <span>{dislikes}</span>
      </button>
      <button
        className={`reaction-btn ${userReaction === "heart" ? "reaction-active" : ""}`}
        onClick={() => handleReaction("heart")}
        disabled={loading}
      >
        ❤️ <span>{hearts}</span>
      </button>
    </div>
  );
}