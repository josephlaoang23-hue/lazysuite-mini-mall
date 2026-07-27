import { getRelatedTools } from "../data/toolRegistry";
import type { UnifiedTool } from "../data/toolRegistry";

interface RelatedToolsProps {
  toolId: string;
  onSelectTool?: (toolId: string) => void;
}

export default function RelatedTools({ toolId, onSelectTool }: RelatedToolsProps) {
  const related = getRelatedTools(toolId);
  if (!related || related.length === 0) return null;

  return (
    <section aria-label="Related Tools" style={{ marginTop: "3rem", marginBottom: "2rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.25rem", color: "#f8fafc" }}>
        Related AI Tools
      </h2>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {related.map((tool: UnifiedTool) => (
          <a
            key={tool.id}
            href={tool.seo.canonical}
            onClick={(e) => {
              if (onSelectTool) {
                e.preventDefault();
                onSelectTool(tool.id);
              }
            }}
            style={{
              display: "block",
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "0.5rem",
              padding: "1rem",
              textDecoration: "none",
              transition: "border-color 0.2s",
            }}
          >
            <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#38bdf8", textTransform: "uppercase" }}>
              {tool.category}
            </span>
            <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#f8fafc", margin: "0.375rem 0" }}>
              {tool.title}
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "#94a3b8", margin: 0, lineHeight: "1.4" }}>
              {tool.desc}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
