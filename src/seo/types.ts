// Layer 1 — Required on every tool
export interface RequiredSeoMeta {
  title: string;
  description: string;
  canonical: string; // relative path, e.g. "/humanizer"
}

// Layer 2 — SEO enhancements & social metadata
export interface SeoLayerMeta {
  category?: string;
  keywords?: string[];
  ogImage?: string;
  twitterImage?: string;
  robots?: string; // e.g. "index, follow"
  priority?: "high" | "medium" | "low" | number;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  lastModified?: string; // ISO date string, e.g. "2026-07-25"
}

// Layer 3 — Rich content & schema metadata
export interface OptionalContentMeta {
  tagline?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  featured?: boolean;
  icon?: string;
  accepts?: string;
  outputType?: string;
  estimatedTime?: string;
  exampleInput?: string;
  exampleOutput?: string;
  audience?: string[];
  searchIntent?: string;
  relatedTools?: string[]; // array of toolIds or canonical paths
  faq?: { question: string; answer: string }[];
  breadcrumbs?: { name: string; url: string }[];
  useCases?: string[];
  steps?: string[];
}

export type ToolSeoMeta = RequiredSeoMeta & SeoLayerMeta & OptionalContentMeta;