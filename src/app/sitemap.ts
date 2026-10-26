import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { infoPages } from "@/content/pages";
import { getProducts, getVisibleCategories } from "@/server/catalog/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  // Productos de demostración no se publican en el sitemap.
  const [products, categories] = await Promise.all([getProducts(), getVisibleCategories()]);
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: `${base}/catalogo/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products
      .filter((p) => !p.isDemo)
      .map((p) => ({ url: `${base}/producto/${p.slug}`, lastModified: p.publishedAt, priority: 0.7 })),
    ...Object.values(infoPages).map((p) => ({ url: `${base}/${p.slug}`, priority: 0.3 })),
  ];
}
