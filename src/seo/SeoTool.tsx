import { Helmet } from "react-helmet-async";
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "./siteConfig";
import type { ToolSeoMeta } from "./types";

interface SeoToolProps {
  metadata: ToolSeoMeta;
  /** Cross-referenced from src/data/tools.ts by id — never duplicated in TOOL_METADATA itself. */
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
  } = metadata;

  const fullUrl = canonical.startsWith("http") ? canonical : `${SITE_URL}${canonical}`;
  const image = ogImage || DEFAULT_OG_IMAGE;
  const twitterImg = twitterImage || image;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: title,
    description,
    url: fullUrl,
    applicationCategory: category || "UtilityApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
  };

  if (keywords && keywords.length > 0) {
    jsonLd.keywords = keywords.join(", ");
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

      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}