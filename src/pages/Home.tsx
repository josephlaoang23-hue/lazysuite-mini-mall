import { featuredTools } from "../data/tools";

interface HomeProps {
  setRoute: (route: string) => void;
}

export default function Home({ setRoute }: HomeProps) {
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
            onClick={() => setRoute("other-tools")}
            className="btn-other-tools"
          >
            📁 Other Tools
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

      <div
        className="grid-container"
        style={{ marginBottom: "24px" }}
      >
        {featuredTools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => setRoute(tool.id)}
            className="tool-card"
          >
            <h3 className="tool-card-title">{tool.title}</h3>

            <p className="tool-card-desc">
              {tool.desc}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}