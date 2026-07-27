import { Helmet } from "react-helmet-async";
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "./siteConfig";
import type { ToolSeoMeta } from "./types";

interface SeoToolProps {
  metadata: ToolSeoMeta;
  category?: string;
}

export default function SeoTool({ metadata, category }: SeoToolProps) {
  const {
    title,
    description,
    canonical,
    keywords,
    ogImage,
    twitterImage,
    robots = "index, follow",
    faq,
    breadcrumbs,
    steps,
  } = metadata;

  const fullUrl = canonical.startsWith("http") ? canonical : `${SITE_URL}${canonical}`;
  const image = ogImage || DEFAULT_OG_IMAGE;
  const twitterImg = twitterImage || image;

  // 1. SoftwareApplication Schema
  const softwareAppSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: title,
    description,
    url: fullUrl,
    applicationCategory: category || metadata.category || "UtilityApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  if (keywords && keywords.length > 0) {
    softwareAppSchema.keywords = keywords.join(", ");
  }

  // 2. Optional FAQPage Schema
  let faqSchema: Record<string, unknown> | null = null;
  if (faq && faq.length > 0) {
    faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };
  }

  // 3. Optional BreadcrumbList Schema
  let breadcrumbSchema: Record<string, unknown> | null = null;
  const crumbs = breadcrumbs || [
    { name: "Home", url: "/" },
    { name: category || "Tools", url: `/${(category || "tools").toLowerCase().replace(/\s+/g, "-")}` },
    { name: title, url: canonical },
  ];
  if (crumbs && crumbs.length > 0) {
    breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((crumb, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: crumb.name,
        item: crumb.url.startsWith("http") ? crumb.url : `${SITE_URL}${crumb.url}`,
      })),
    };
  }

  // 4. Optional HowTo Schema
  let howToSchema: Record<string, unknown> | null = null;
  if (steps && steps.length > 0) {
    howToSchema = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to use ${title}`,
      step: steps.map((stepText, idx) => ({
        "@type": "HowToStep",
        position: idx + 1,
        text: stepText,
      })),
    };
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />
      <meta name="robots" content={robots} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#020617" />
      <html lang="en" />
      <meta name="author" content={SITE_NAME} />
      <meta name="application-name" content={SITE_NAME} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={twitterImg} />

      {/* Structured Data */}
      <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      {breadcrumbSchema && <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>}
      {howToSchema && <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>}
    </Helmet>
  );
}