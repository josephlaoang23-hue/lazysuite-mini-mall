import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOOL_METADATA } from "../src/seo/toolMetadata";
import { SITE_URL } from "../src/seo/siteConfig";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function toUrl(canonical: string): string {
  return canonical.startsWith("http") ? canonical : `${SITE_URL}${canonical}`;
}

function priorityToNumber(priority?: "high" | "medium" | "low"): string {
  if (priority === "high") return "0.9";
  if (priority === "low") return "0.5";
  return "0.7";
}

const staticEntries = [
  { loc: SITE_URL, changefreq: "daily", priority: "1.0" },
];

const toolEntries = Object.values(TOOL_METADATA).map((meta: any) => ({
  loc: toUrl(meta.canonical),
  changefreq: meta.changeFrequency || "weekly",
  priority: priorityToNumber(meta.priority),
  lastmod: meta.lastModified,
}));

const allEntries = [...staticEntries, ...toolEntries];

const urlsXml = allEntries
  .map((e: any) => {
    const lastmodLine = e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : "";
    return `  <url>
    <loc>${e.loc}</loc>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>${lastmodLine}
  </url>`;
  })
  .join("\n");

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>
`;

const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

const publicDir = path.resolve(__dirname, "../public");
fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemapXml);
fs.writeFileSync(path.join(publicDir, "robots.txt"), robotsTxt);

console.log(`✓ Generated sitemap.xml with ${allEntries.length} URLs`);
console.log(`✓ Generated robots.txt`);