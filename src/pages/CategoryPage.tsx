import React from "react";
import { Helmet } from "react-helmet-async";
import { CATEGORY_MAP, getToolsByCategory } from "../data/toolRegistry";
import { SITE_NAME, SITE_URL } from "../seo/siteConfig";

interface CategoryPageProps {
  categorySlug: string;
  onSelectTool?: (toolId: string) => void;
  onReturnHome?: () => void;
}

export default function CategoryPage({ categorySlug, onSelectTool, onReturnHome }: CategoryPageProps) {
  const categoryInfo = CATEGORY_MAP[categorySlug] || {
    slug: categorySlug,
    name: categorySlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    description: `Explore free AI tools and utilities in ${categorySlug}.`,
  };

  const tools = getToolsByCategory(categorySlug);
  const canonicalUrl = `${SITE_URL}/${categoryInfo.slug}`;

  // ItemList Schema
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: categoryInfo.name,
    description: categoryInfo.description,
    url: canonicalUrl,
    numberOfItems: tools.length,
    itemListElement: tools.map((tool, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: tool.title,
      description: tool.desc,
      url: `${SITE_URL}${tool.seo.canonical}`,
    })),
  };

  return (
    <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1rem", color: "#f8fafc" }}>
      <Helmet>
        <title>{`${categoryInfo.name} | ${SITE_NAME}`}</title>
        <meta name="description" content={categoryInfo.description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${categoryInfo.name} | ${SITE_NAME}`} />
        <meta property="og:description" content={categoryInfo.description} />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>

      <nav aria-label="Breadcrumb" style={{ marginBottom: "1.5rem", fontSize: "0.875rem", color: "#94a3b8" }}>
        <button
          onClick={onReturnHome}
          style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", padding: 0, textDecoration: "underline" }}
        >
          ← Return to Boutique Mall Lobby
        </button>
      </nav>

      <header style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2.25rem", fontWeight: "700", marginBottom: "0.75rem", color: "#f8fafc" }}>
          {categoryInfo.name}
        </h1>
        <p style={{ fontSize: "1.125rem", color: "#94a3b8", lineHeight: "1.6" }}>
          {categoryInfo.description}
        </p>
      </header>

      <section aria-label="Tools List">
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.25rem", color: "#cbd5e1" }}>
          Available Micro-Utilities ({tools.length})
        </h2>

        {tools.length === 0 ? (
          <p style={{ color: "#64748b" }}>No tools found in this category yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {tools.map((tool) => (
              <article
                key={tool.id}
                onClick={() => onSelectTool && onSelectTool(tool.id)}
                style={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "0.75rem",
                  padding: "1.25rem",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "600", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: "#1e293b", color: "#38bdf8" }}>
                    {tool.category}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#e2e8f0" }}>{tool.creator}</span>
                </div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#f8fafc", marginBottom: "0.5rem" }}>
                  {tool.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: "1.5" }}>
                  {tool.desc}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
