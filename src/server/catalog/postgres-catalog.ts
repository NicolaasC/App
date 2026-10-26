import type { Sql } from "@/server/db";
import type { CatalogImage, Category, CategorySlug, Gender, Product } from "@/lib/catalog/types";
import type { CatalogRepository } from "./repository";

/** Catálogo leído de PostgreSQL (solo productos publicados). */
export function createPostgresCatalog(sql: Sql): CatalogRepository {
  async function load(where: { slug?: string; skus?: string[] } = {}): Promise<Product[]> {
    const products = await sql`
      select p.* from products p
      where p.status = 'published'
        ${where.slug ? sql`and p.slug = ${where.slug}` : sql``}
        ${where.skus ? sql`and exists (select 1 from variants v where v.product_id = p.id and v.sku in ${sql(where.skus)})` : sql``}
      order by p.rank desc, p.name
    `;
    if (!products.length) return [];
    const ids = products.map((p) => p.id as string);
    const [colors, variants, images, materials] = await Promise.all([
      sql`select * from product_colors where product_id in ${sql(ids)} order by position`,
      sql`select * from variants where product_id in ${sql(ids)} order by size`,
      sql`select * from product_images where product_id in ${sql(ids)} order by position`,
      sql`select * from product_materials where product_id in ${sql(ids)} order by position`,
    ]);
    const colorKey = new Map(colors.map((c) => [c.id as string, c.color_key as string]));

    return products.map((p): Product => ({
      id: p.code,
      slug: p.slug,
      name: p.name,
      shortDescription: p.short_description,
      description: p.description,
      category: p.category_slug as CategorySlug,
      gender: p.gender as Gender,
      price: p.price_cop,
      compareAtPrice: p.compare_at_price_cop ?? undefined,
      colors: colors
        .filter((c) => c.product_id === p.id)
        .map((c) => ({ id: c.color_key, name: c.name, swatch: c.swatch })),
      variants: variants
        .filter((v) => v.product_id === p.id)
        .map((v) => ({ sku: v.sku, colorId: colorKey.get(v.color_id) ?? "", size: Number(v.size), stock: v.stock })),
      materials: materials
        .filter((m) => m.product_id === p.id)
        .map((m) => ({ label: m.label, verified: m.verified })),
      images: images
        .filter((i) => i.product_id === p.id)
        .map(
          (i): CatalogImage => ({
            id: i.id,
            src: i.src,
            alt: i.alt,
            width: i.width ?? undefined,
            height: i.height ?? undefined,
            focal: i.focal ?? undefined,
            colorId: i.color_id ? colorKey.get(i.color_id) : undefined,
            credit: i.credit ?? { author: null, sourceUrl: "", license: "Unsplash License" },
            provisional: i.provisional,
          }),
        ),
      collections: p.collections,
      featured: p.featured,
      isNew: p.is_new,
      publishedAt: new Date(p.published_at).toISOString().slice(0, 10),
      status: "published",
      rank: p.rank,
      isDemo: p.is_demo,
    }));
  }

  return {
    source: "supabase",
    async listCategories() {
      const rows = await sql`select * from categories order by position`;
      return rows.map(
        (c): Category => ({
          slug: c.slug,
          name: c.name,
          description: c.description,
          position: c.position,
          showWhenEmpty: c.show_when_empty,
        }),
      );
    },
    listProducts: () => load(),
    async getProductBySlug(slug) {
      return (await load({ slug }))[0] ?? null;
    },
    async findVariants(skus) {
      const result = new Map();
      if (!skus.length) return result;
      for (const product of await load({ skus })) {
        for (const variant of product.variants) {
          if (skus.includes(variant.sku)) result.set(variant.sku, { product, variant });
        }
      }
      return result;
    },
  };
}
