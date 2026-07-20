import { useEffect, useState } from "react";
import { allTools } from "../data/tools";
import type { ToolMeta } from "../data/tools";

interface HomeProps {
  setRoute: (route: string) => void;
}

interface RankedTool extends ToolMeta {
  clicks: number;
}

const RANK_LABELS = ["First", "Second", "Third", "Fourth", "Fifth"];

export default function Home({ setRoute }: HomeProps) {
  const [rankedTools, setRankedTools] = useState<RankedTool[]>(
    allTools.map((t) => ({ ...t, clicks: 0 }))
  );

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await fetch("/api/tool-rankings");
        const data = await res.json();

        const clickMap: Record<string, number> = {};
        (data.rankings || []).forEach((r: { id: string; clicks: number }) => {
          clickMap[r.id] = r.clicks;
        });

        const merged = allTools
          .map((t) => ({ ...t, clicks: clickMap[t.id] ?? 0 }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 5);

        setRankedTools(merged);
      } catch (err) {
        console.error("Failed to fetch tool rankings:", err);
      }
    };

    fetchRankings();
  }, []);

  return (
    <>
      <div className="lobby-header">
        <h1 className="lobby-title">LazySuite Mall</h1>

        <p className="lobby-desc">
          Launch hyper-focused data engines or engineer your own monetized
          micro-utility pipelines.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginTop: "16px",
          }}
        >
          <button
            onClick={() => setRoute("my-tools")}
            className="btn-other-tools"
          >
            📁 My Tools
          </button>

          <button
            onClick={() => alert("Coming in the next update!")}
            className="btn-create-earn"
          >
            🔥 Create and Earn Money
          </button>
        </div>
      </div>

      <div className="section-label">Featured Core Boutiques</div>

      <div className="grid-container" style={{ marginBottom: "24px" }}>
        {rankedTools.map((tool, index) => (
          <div
            key={tool.id}
            onClick={() => setRoute(tool.id)}
            className="tool-card"
          >
            <span className="tool-rank-badge">
              #{index + 1} {RANK_LABELS[index]}
            </span>
            <span className="tool-badge-admin">{tool.creator}</span>

            <h3 className="tool-card-title" style={{ marginTop: "18px" }}>
              {tool.title}
            </h3>

            <p className="tool-card-desc">{tool.desc}</p>

            <p className="tool-card-category">{tool.category}</p>
          </div>
        ))}
      </div>
    </>
  );
}