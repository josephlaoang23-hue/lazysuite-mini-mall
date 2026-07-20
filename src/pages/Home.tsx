import { useRankedTools } from "../hooks/useRankedTools";
import AdsterraNativeBanner from "../ads/AdsterraNativeBanner";

interface HomeProps {
  setRoute: (route: string) => void;
}

export default function Home({ setRoute }: HomeProps) {
  const { rankedTools } = useRankedTools();
  const topFive = rankedTools.slice(0, 5);

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
        {topFive.map((tool, index) => (
          <div
            key={tool.id}
            onClick={() => setRoute(tool.id)}
            className="tool-card"
          >
            <span className={`tool-rank-badge ${index === 0 ? "tool-rank-gold" : index === 1 ? "tool-rank-silver" : index === 2 ? "tool-rank-bronze" : ""}`}>
              #{index + 1}
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

      <AdsterraNativeBanner />
    </>
  );
}