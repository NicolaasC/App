import type { Sql } from "@/server/db";
import type { Category, Product } from "@/lib/catalog/types";

/**
 * Carga (o actualiza) categorías y productos en la base de datos. Idempotente
 * por código de producto y SKU. Pensado para datos de demostración y pruebas;
 * NO sobrescribe existencias de variantes ya existentes salvo `resetStock`.
 */
export async function seedCatalog(
  sql: Sql,
  categories: Category[],
  products: Product[],
  options: { resetStock?: boolean } = {},
) {
  await sql.begin(async (tx) => {
    for (const c of categories) {
      await tx`
        insert into categories (slug, name, description, position, show_when_empty)
        values (${c.slug}, ${c.name}, ${c.description}, ${c.position}, ${c.showWhenEmpty ?? false})
        on conflict (slug) do update set name = excluded.name, description = excluded.description, position = excluded.position
      `;
    }
    for (const p of products) {
      const [row] = await tx`
        insert into products (code, slug, name, short_description, description, category_slug, gender, price_cop,
          compare_at_price_cop, status, featured, is_new, rank, collections, is_demo, published_at)
        values (${p.id}, ${p.slug}, ${p.name}, ${p.shortDescription}, ${p.description}, ${p.category}, ${p.gender},
          ${p.price}, ${p.compareAtPrice ?? null}, ${p.status}, ${p.featured}, ${p.isNew}, ${p.rank},
          ${p.collections}, ${p.isDemo}, ${p.publishedAt})
        on conflict (code) do update set slug = excluded.slug, name = excluded.name, price_cop = excluded.price_cop,
          status = excluded.status, featured = excluded.featured, is_new = excluded.is_new, rank = excluded.rank,
          collections = excluded.collections, is_demo = excluded.is_demo
        returning id
      `;
      await tx`delete from product_materials where product_id = ${row.id}`;
      await tx`delete from product_images where product_id = ${row.id}`;
      const colorIds = new Map<string, string>();
      for (const [i, c] of p.colors.entries()) {
        const [color] = await tx`
          insert into product_colors (product_id, color_key, name, swatch, position)
          values (${row.id}, ${c.id}, ${c.name}, ${c.swatch}, ${i})
          on conflict (product_id, color_key) do update set name = excluded.name, swatch = excluded.swatch
          returning id
        `;
        colorIds.set(c.id, color.id);
      }
      for (const [i, m] of p.materials.entries()) {
        await tx`insert into product_materials (product_id, label, verified, position) values (${row.id}, ${m.label}, ${m.verified}, ${i})`;
      }
      for (const [i, img] of p.images.entries()) {
        if (!img.src) continue;
        await tx`
          insert into product_images (product_id, color_id, src, alt, width, height, focal, position, provisional, credit)
          values (${row.id}, ${img.colorId ? (colorIds.get(img.colorId) ?? null) : null}, ${img.src}, ${img.alt},
            ${img.width ?? null}, ${img.height ?? null}, ${img.focal ?? null}, ${i}, ${img.provisional},
            ${tx.json(JSON.parse(JSON.stringify(img.credit)))})
        `;
      }
      for (const v of p.variants) {
        await tx`
          insert into variants (sku, product_id, color_id, size, stock)
          values (${v.sku}, ${row.id}, ${colorIds.get(v.colorId)!}, ${v.size}, ${v.stock})
          on conflict (sku) do update set stock = ${options.resetStock ? tx`excluded.stock` : tx`variants.stock`}
        `;
      }
    }
  });
}
