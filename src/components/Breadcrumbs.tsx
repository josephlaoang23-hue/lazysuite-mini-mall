import React from "react";
import { normalizeCategorySlug, CATEGORY_MAP } from "../data/toolRegistry";

interface BreadcrumbsProps {
  category?: string;
  toolTitle: string;
  onNavigateHome?: () => void;
  onNavigateCategory?: (slug: string) => void;
}

export default function Breadcrumbs({ category, toolTitle, onNavigateHome, onNavigateCategory }: BreadcrumbsProps) {
  const categorySlug = category ? normalizeCategorySlug(category) : "daily-tools";
  const categoryName = category || CATEGORY_MAP[categorySlug]?.name || "Tools";

  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: "1rem", fontSize: "0.875rem", color: "#94a3b8" }}>
      <ol style={{ display: "flex", alignItems: "center", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0 }}>
        <li>
          <button
            onClick={onNavigateHome}
            style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", padding: 0 }}
          >
            Home
          </button>
        </li>
        <li>/</li>
        <li>
          <button
            onClick={() => onNavigateCategory && onNavigateCategory(categorySlug)}
            style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", padding: 0 }}
          >
            {categoryName}
          </button>
        </li>
        <li>/</li>
        <li style={{ color: "#e2e8f0", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {toolTitle}
        </li>
      </ol>
    </nav>
  );
}
