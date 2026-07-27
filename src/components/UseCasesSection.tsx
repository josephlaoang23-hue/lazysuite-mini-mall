
interface UseCasesSectionProps {
  useCases?: string[];
}

export default function UseCasesSection({ useCases }: UseCasesSectionProps) {
  if (!useCases || useCases.length === 0) return null;

  return (
    <section aria-label="Popular Use Cases" style={{ marginTop: "2rem", marginBottom: "2rem" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1rem", color: "#f8fafc" }}>
        Popular Uses
      </h2>

      <ul style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0 }}>
        {useCases.map((useCase, idx) => (
          <li
            key={idx}
            style={{
              backgroundColor: "#1e293b",
              color: "#cbd5e1",
              fontSize: "0.875rem",
              padding: "0.375rem 0.75rem",
              borderRadius: "0.375rem",
              border: "1px solid #334155",
            }}
          >
            • {useCase}
          </li>
        ))}
      </ul>
    </section>
  );
}
