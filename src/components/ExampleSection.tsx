import React from "react";

interface ExampleSectionProps {
  exampleInput?: string;
  exampleOutput?: string;
}

export default function ExampleSection({ exampleInput, exampleOutput }: ExampleSectionProps) {
  if (!exampleInput && !exampleOutput) return null;

  return (
    <section aria-label="Example Usage" style={{ marginTop: "2rem", marginBottom: "2rem" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1rem", color: "#f8fafc" }}>
        Example Usage
      </h2>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {exampleInput && (
          <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "0.5rem", padding: "1rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#94a3b8", marginBottom: "0.5rem", textTransform: "uppercase" }}>
              Example Input
            </h3>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "0.875rem", color: "#e2e8f0", fontFamily: "monospace" }}>
              {exampleInput}
            </pre>
          </div>
        )}

        {exampleOutput && (
          <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "0.5rem", padding: "1rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#38bdf8", marginBottom: "0.5rem", textTransform: "uppercase" }}>
              Example Output
            </h3>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "0.875rem", color: "#e2e8f0", fontFamily: "monospace" }}>
              {exampleOutput}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
