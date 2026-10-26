import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, "");
  if (!siteConfig.indexable) {
    // Sitio de demostración / Preview: no indexar.
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/carrito", "/checkout", "/pedido/", "/api/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
