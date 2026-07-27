import React from "react";

interface AudienceSectionProps {
  audience?: string[];
}

export default function AudienceSection({ audience }: AudienceSectionProps) {
  if (!audience || audience.length === 0) return null;

  return (
    <section aria-label="Target Audience" style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
      <h2 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.75rem", color: "#cbd5e1" }}>
        Best For
      </h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {audience.map((item, idx) => (
          <span
            key={idx}
            style={{
              backgroundColor: "#0284c7",
              color: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: "600",
              padding: "0.25rem 0.625rem",
              borderRadius: "9999px",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
