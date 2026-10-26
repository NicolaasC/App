import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Category, Product } from "@/lib/catalog/types";
import { productAvailability } from "@/lib/catalog/variants";
import { sortProducts } from "@/lib/catalog/filters";
import { catalogRepository } from "./repository";

export interface CategoryWithCount extends Category {
  productCount: number;
  coverProduct: Product | null;
}

/** Categorías visibles: solo las que tienen productos publicados (o decisión editorial). */
export async function getVisibleCategories(): Promise<CategoryWithCount[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  const repo = catalogRepository();
  const [categories, products] = await Promise.all([repo.listCategories(), repo.listProducts()]);
  return categories
    .map((category) => {
      const inCategory = sortProducts(
        products.filter((p) => p.category === category.slug),
        "relevancia",
      );
      return { ...category, productCount: inCategory.length, coverProduct: inCategory[0] ?? null };
    })
    .filter((c) => c.productCount > 0 || c.showWhenEmpty);
}

export async function getCategory(slug: string): Promise<CategoryWithCount | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  return (await getVisibleCategories()).find((c) => c.slug === slug) ?? null;
}

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  return catalogRepository().listProducts();
}

export async function getProduct(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  return catalogRepository().getProductBySlug(slug);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  const products = await getProducts();
  return sortProducts(
    products.filter((p) => p.featured && productAvailability(p) !== "out_of_stock"),
    "relevancia",
  ).slice(0, limit);
}

export async function getNewArrivals(limit = 4): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  const products = await getProducts();
  return sortProducts(products.filter((p) => p.isNew), "novedades").slice(0, limit);
}

export const COLLECTION_LABELS: Record<string, { title: string; description: string }> = {
  esenciales: {
    title: "Esenciales",
    description: "Modelos versátiles para usar todos los días.",
  },
  "fin-de-semana": {
    title: "Fin de semana",
    description: "Para salir de la ciudad, caminar y descansar.",
  },
  oficina: {
    title: "Oficina",
    description: "Opciones sobrias para la jornada laboral.",
  },
};

export async function getCollection(tag: string, limit = 4) {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  const products = await getProducts();
  const items = sortProducts(products.filter((p) => p.collections.includes(tag)), "relevancia");
  const label = COLLECTION_LABELS[tag] ?? { title: tag, description: "" };
  return { tag, ...label, products: items.slice(0, limit), total: items.length };
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  const products = (await getProducts()).filter((p) => p.id !== product.id);
  const score = (p: Product) =>
    (p.category === product.category ? 3 : 0) +
    (p.gender === product.gender || p.gender === "unisex" ? 1 : 0) +
    p.collections.filter((c) => product.collections.includes(c)).length;
  return products
    .filter((p) => productAvailability(p) !== "out_of_stock")
    .sort((a, b) => score(b) - score(a) || b.rank - a.rank)
    .slice(0, limit);
}
