// Layer 1 — Required on every tool
export interface RequiredSeoMeta {
    title: string;
    description: string;
    canonical: string; // relative path, e.g. "/humanizer" — domain is prepended by <SeoTool/>
  }
  
  // Layer 2 — SEO enhancements, all optional
  export interface SeoLayerMeta {
    keywords?: string[];
    ogImage?: string;
    twitterImage?: string;
    robots?: string; // e.g. "index, follow" — defaults to that if omitted
    priority?: "high" | "medium" | "low";
    changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    lastModified?: string; // ISO date string, e.g. "2026-07-25"
  }
  
  // Layer 3 — Optional content blocks, built later in Phase 3.
  // Defined now so Phase 1 metadata is forward-compatible without a breaking change later.
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
    relatedTools?: string[]; // array of toolIds
    faq?: { question: string; answer: string }[];
    useCases?: string[];
    steps?: string[];
  }
  
  export type ToolSeoMeta = RequiredSeoMeta & SeoLayerMeta & OptionalContentMeta;