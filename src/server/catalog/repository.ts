import "server-only";
import { demoCategories } from "@/data/demo/categories";
import { demoProducts } from "@/data/demo/products";
import type { Category, Product, Variant } from "@/lib/catalog/types";
import { getSql } from "@/server/db";
import { createPostgresCatalog } from "./postgres-catalog";

/**
 * Contrato de acceso a datos del catálogo. La implementación de demostración
 * lee archivos locales; la de Supabase se incorporará en la fase de backend
 * (ver docs/modelo-de-datos.md) sin cambiar las páginas.
 */
export interface CatalogRepository {
  readonly source: "demo" | "supabase";
  listCategories(): Promise<Category[]>;
  listProducts(): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  /** Resuelve SKUs a su producto y variante (para validar carritos). */
  findVariants(skus: string[]): Promise<Map<string, { product: Product; variant: Variant }>>;
}

export function createInMemoryCatalog(categories: Category[], products: Product[]): CatalogRepository {
  const published = () => products.filter((p) => p.status === "published");
  return {
    source: "demo",
    async listCategories() {
      return [...categories].sort((a, b) => a.position - b.position);
    },
    async listProducts() {
      return published();
    },
    async getProductBySlug(slug) {
      return published().find((p) => p.slug === slug) ?? null;
    },
    async findVariants(skus) {
      const wanted = new Set(skus);
      const result = new Map<string, { product: Product; variant: Variant }>();
      for (const product of published()) {
        for (const variant of product.variants) {
          if (wanted.has(variant.sku)) result.set(variant.sku, { product, variant });
        }
      }
      return result;
    },
  };
}

let repository: CatalogRepository | null = null;

export function catalogRepository(): CatalogRepository {
  if (repository) return repository;
  const source = process.env.CATALOG_SOURCE ?? "demo";
  if (source === "supabase") {
    const sql = getSql();
    if (!sql) throw new Error("CATALOG_SOURCE=supabase requiere DATABASE_URL.");
    repository = createPostgresCatalog(sql);
    return repository;
  }
  repository = createInMemoryCatalog(demoCategories, demoProducts);
  return repository;
}
