import { allTools } from "./tools";
import type { ToolMeta } from "./tools";
import { TOOL_METADATA } from "../seo/toolMetadata";
import type { ToolSeoMeta } from "../seo/types";

export interface UnifiedTool extends ToolMeta {
  seo: ToolSeoMeta;
}

export const CATEGORY_MAP: Record<string, { slug: string; name: string; description: string }> = {
  "daily-tools": {
    slug: "daily-tools",
    name: "Daily Tools",
    description: "Everyday AI utilities for text cleaning, file renaming, bill analysis, and productivity.",
  },
  "business-tools": {
    slug: "business-tools",
    name: "Business Tools",
    description: "Professional AI micro-utilities for appraisals, estimates, log audits, and disputes.",
  },
  "dev-tools": {
    slug: "dev-tools",
    name: "Dev Tools",
    description: "Developer tools for prompt compression, code modernizing, diagrams, and logic maps.",
  },
  "research-tools": {
    slug: "research-tools",
    name: "Research Tools",
    description: "AI analysis tools for document gap auditing, transcript evidence matrices, and abstract synthesis.",
  },
  "privacy-tools": {
    slug: "privacy-tools",
    name: "Privacy & Security Tools",
    description: "Privacy shields, phishing dissectors, and dark pattern audits.",
  },
  "education-tools": {
    slug: "education-tools",
    name: "Education Tools",
    description: "Transcript structurers and accessibility auditors for educational & UX improvement.",
  },
  "creator-tools": {
    slug: "creator-tools",
    name: "Creator Tools",
    description: "AI-assisted tools tailored for digital content creators, writers, and designers.",
  },
};

// Map tool category strings to standard slugs
export function normalizeCategorySlug(categoryStr: string): string {
  const lower = categoryStr.toLowerCase();
  if (lower.includes("daily")) return "daily-tools";
  if (lower.includes("business")) return "business-tools";
  if (lower.includes("dev")) return "dev-tools";
  if (lower.includes("research")) return "research-tools";
  if (lower.includes("security") || lower.includes("privacy")) return "privacy-tools";
  if (lower.includes("education")) return "education-tools";
  if (lower.includes("creator")) return "creator-tools";
  return "daily-tools";
}

// Build unified registry
export const TOOL_REGISTRY: UnifiedTool[] = allTools.map((tool) => {
  const metadata = (TOOL_METADATA as Record<string, ToolSeoMeta>)[tool.id] || {
    title: tool.title,
    description: tool.desc,
    canonical: `/${tool.id}`,
  };


  return {
    ...tool,
    seo: {
      ...metadata,
      category: metadata.category || tool.category,
      featured: metadata.featured !== undefined ? metadata.featured : true,
      canonical: metadata.canonical || `/${tool.id}`,
    },
  };
});

// Single Source of Truth Utility Functions
export function getToolRegistry(): UnifiedTool[] {
  return TOOL_REGISTRY;
}

export function getToolById(id: string): UnifiedTool | undefined {
  return TOOL_REGISTRY.find((t) => t.id === id);
}

export function getToolByCanonical(canonicalPath: string): UnifiedTool | undefined {
  const cleanPath = canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`;
  return TOOL_REGISTRY.find((t) => t.seo.canonical === cleanPath || t.id === cleanPath.substring(1));
}

export function getToolsByCategory(categorySlug: string): UnifiedTool[] {
  return TOOL_REGISTRY.filter((t) => normalizeCategorySlug(t.category) === categorySlug);
}

export function getFeaturedTools(): UnifiedTool[] {
  return TOOL_REGISTRY.filter((t) => t.seo.featured || t.isLive);
}

export function getRelatedTools(toolId: string): UnifiedTool[] {
  const target = getToolById(toolId);
  if (!target) return [];

  if (target.seo.relatedTools && target.seo.relatedTools.length > 0) {
    const related = target.seo.relatedTools
      .map((idOrCanonical) => getToolById(idOrCanonical) || getToolByCanonical(idOrCanonical))
      .filter((t): t is UnifiedTool => t !== undefined);
    if (related.length > 0) return related;
  }

  // Fallback to same category tools
  const sameCategory = getToolsByCategory(normalizeCategorySlug(target.category));
  return sameCategory.filter((t) => t.id !== toolId).slice(0, 4);
}
