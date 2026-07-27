import { TOOL_REGISTRY, UnifiedTool } from "../data/toolRegistry";

export interface SearchResult {
  tool: UnifiedTool;
  score: number;
}

export function searchTools(query: string): UnifiedTool[] {
  const q = query.trim().toLowerCase();
  if (!q) return TOOL_REGISTRY;

  return TOOL_REGISTRY.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(q);
    const descMatch = item.desc.toLowerCase().includes(q);
    const categoryMatch = item.category.toLowerCase().includes(q);
    const keywordMatch = item.seo.keywords?.some((k) => k.toLowerCase().includes(q));
    const taglineMatch = item.seo.tagline?.toLowerCase().includes(q);

    return titleMatch || descMatch || categoryMatch || keywordMatch || taglineMatch;
  });
}
