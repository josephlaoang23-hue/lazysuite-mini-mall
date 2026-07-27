import React from "react";

interface FaqSectionProps {
  faq?: { question: string; answer: string }[];
}

export default function FaqSection({ faq }: FaqSectionProps) {
  if (!faq || faq.length === 0) return null;

  return (
    <section aria-label="Frequently Asked Questions" style={{ marginTop: "2.5rem", marginBottom: "2rem" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.25rem", color: "#f8fafc" }}>
        Frequently Asked Questions
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {faq.map((item, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "0.5rem",
              padding: "1.25rem",
            }}
          >
            <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#e2e8f0", marginBottom: "0.5rem" }}>
              {item.question}
            </h3>
            <p style={{ fontSize: "0.9375rem", color: "#94a3b8", lineHeight: "1.6", margin: 0 }}>
              {item.answer}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#cbd5e1", marginBottom: "0.75rem" }}>
          People Also Ask
        </h3>
        <ul style={{ listStyleType: "disc", paddingLeft: "1.5rem", color: "#94a3b8", fontSize: "0.9375rem", lineHeight: "1.8" }}>
          {faq.map((item, idx) => (
            <li key={idx}>{item.question}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
