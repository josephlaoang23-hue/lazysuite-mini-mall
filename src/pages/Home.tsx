import { useRankedTools } from "../hooks/useRankedTools";
import AdsterraNativeBanner from "../ads/AdsterraNativeBanner";

interface HomeProps {
  setRoute: (route: string) => void;
}

export default function Home({ setRoute }: HomeProps) {
  const { rankedTools, loaded } = useRankedTools();
  const topFive = rankedTools.slice(0, 5);

  if (!loaded) {
    return (
      <p style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: '13px' }}>
        Loading tools...
      </p>
    );
  }

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
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setRoute("daily-tools")}
            className="btn-other-tools"
          >
            📁 Daily Tools
          </button>

          <button
            onClick={() => setRoute("business-tools")}
            className="btn-create-earn"
          >
            💼 Business Tools
          </button>

          <button
            onClick={() => setRoute("dev-tools")}
            className="btn-dev-tools"
          >
            🛠️ Dev Tools
          </button>

          <button
            onClick={() => setRoute("research-tools")}
            className="btn-research-tools"
          >
            📊 Research & Data
          </button>

          <button
            onClick={() => setRoute("security-tools")}
            className="btn-security-tools"
          >
            🔒 Privacy & Security
          </button>

          <button
            onClick={() => setRoute("education-tools")}
            className="btn-education-tools"
          >
            🎓 Education
          </button>

          <button
            onClick={() => setRoute("creator-tools")}
            className="btn-creator-tools"
          >
            🎨 Content Creator
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