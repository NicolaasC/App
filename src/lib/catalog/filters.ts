/**
 * Filtros y ordenamiento del catálogo. Funciones puras: se usan en el cliente
 * (filtrado instantáneo) y se prueban de forma aislada.
 */
import { productAvailability } from "./variants";
import type { CategorySlug, Gender, Product } from "./types";

export const SORT_OPTIONS = [
  { value: "relevancia", label: "Relevancia" },
  { value: "novedades", label: "Novedades" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export interface CatalogFilters {
  q: string;
  categories: CategorySlug[];
  genders: Gender[];
  sizes: number[];
  colors: string[];
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
  /** Etiqueta de colección (p. ej. "esenciales"). */
  collection: string | null;
  sort: SortValue;
}

export const EMPTY_FILTERS: CatalogFilters = {
  q: "",
  categories: [],
  genders: [],
  sizes: [],
  colors: [],
  minPrice: null,
  maxPrice: null,
  inStockOnly: false,
  collection: null,
  sort: "relevancia",
};

const CATEGORY_VALUES: CategorySlug[] = ["sneakers", "casual", "formal", "botas", "sandalias", "otros"];
const GENDER_VALUES: Gender[] = ["mujer", "hombre", "unisex"];

/** Normaliza texto para búsqueda: minúsculas y sin tildes. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function list(params: URLSearchParams, key: string): string[] {
  return params
    .getAll(key)
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
}

function parsePrice(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value.replace(/\D/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Lee filtros desde la URL ignorando valores inválidos. */
export function parseFilters(params: URLSearchParams): CatalogFilters {
  const sortParam = params.get("orden");
  const sort = SORT_OPTIONS.some((o) => o.value === sortParam) ? (sortParam as SortValue) : "relevancia";
  let minPrice = parsePrice(params.get("min"));
  let maxPrice = parsePrice(params.get("max"));
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }
  return {
    q: (params.get("q") ?? "").slice(0, 80),
    categories: list(params, "categoria").filter((c): c is CategorySlug =>
      CATEGORY_VALUES.includes(c as CategorySlug),
    ),
    genders: list(params, "genero").filter((g): g is Gender => GENDER_VALUES.includes(g as Gender)),
    sizes: list(params, "talla")
      .map(Number)
      .filter((n) => Number.isInteger(n) && n >= 30 && n <= 50),
    colors: list(params, "color").filter((c) => /^[a-z0-9-]{1,30}$/.test(c)),
    minPrice,
    maxPrice,
    inStockOnly: params.get("disponible") === "1",
    collection: /^[a-z0-9-]{1,40}$/.test(params.get("coleccion") ?? "") ? params.get("coleccion") : null,
    sort,
  };
}

/** Serializa filtros a la URL omitiendo valores por defecto. */
export function serializeFilters(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.categories.length) params.set("categoria", filters.categories.join(","));
  if (filters.genders.length) params.set("genero", filters.genders.join(","));
  if (filters.sizes.length) params.set("talla", [...filters.sizes].sort((a, b) => a - b).join(","));
  if (filters.colors.length) params.set("color", filters.colors.join(","));
  if (filters.minPrice !== null) params.set("min", String(filters.minPrice));
  if (filters.maxPrice !== null) params.set("max", String(filters.maxPrice));
  if (filters.inStockOnly) params.set("disponible", "1");
  if (filters.collection) params.set("coleccion", filters.collection);
  if (filters.sort !== "relevancia") params.set("orden", filters.sort);
  return params;
}

export function countActiveFilters(filters: CatalogFilters): number {
  return (
    (filters.q.trim() ? 1 : 0) +
    filters.categories.length +
    filters.genders.length +
    filters.sizes.length +
    filters.colors.length +
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.collection ? 1 : 0)
  );
}

function matchesQuery(product: Product, q: string): boolean {
  const terms = normalizeText(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = normalizeText(
    [product.name, product.shortDescription, product.category, product.gender, ...product.colors.map((c) => c.name)].join(" "),
  );
  return terms.every((t) => haystack.includes(t));
}

/**
 * Talla y color se evalúan sobre la MISMA variante: "talla 38 + negro" solo
 * coincide si existe la variante negra en 38 (con existencias si se pide).
 */
function matchesVariant(product: Product, filters: CatalogFilters): boolean {
  if (!filters.sizes.length && !filters.colors.length && !filters.inStockOnly) return true;
  return product.variants.some(
    (v) =>
      (!filters.sizes.length || filters.sizes.includes(v.size)) &&
      (!filters.colors.length || filters.colors.includes(v.colorId)) &&
      (!filters.inStockOnly || v.stock > 0),
  );
}

export function applyFilters(products: Product[], filters: CatalogFilters): Product[] {
  const result = products.filter(
    (p) =>
      p.status === "published" &&
      matchesQuery(p, filters.q) &&
      (!filters.categories.length || filters.categories.includes(p.category)) &&
      (!filters.genders.length || filters.genders.includes(p.gender)) &&
      (!filters.collection || p.collections.includes(filters.collection)) &&
      (filters.minPrice === null || p.price >= filters.minPrice) &&
      (filters.maxPrice === null || p.price <= filters.maxPrice) &&
      matchesVariant(p, filters),
  );
  return sortProducts(result, filters.sort);
}

export function sortProducts(products: Product[], sort: SortValue): Product[] {
  const copy = [...products];
  const byName = (a: Product, b: Product) => a.name.localeCompare(b.name, "es");
  switch (sort) {
    case "precio-asc":
      return copy.sort((a, b) => a.price - b.price || byName(a, b));
    case "precio-desc":
      return copy.sort((a, b) => b.price - a.price || byName(a, b));
    case "novedades":
      return copy.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || byName(a, b));
    case "relevancia":
    default: {
      // Relevancia: disponibles primero, luego puntuación editorial.
      const avail = (p: Product) => (productAvailability(p) === "out_of_stock" ? 1 : 0);
      return copy.sort((a, b) => avail(a) - avail(b) || b.rank - a.rank || byName(a, b));
    }
  }
}

/** Opciones de faceta derivadas del catálogo (nunca listas duplicadas en código). */
export function facetOptions(products: Product[]) {
  const sizes = new Set<number>();
  const colors = new Map<string, { id: string; name: string; swatch: string }>();
  let min = Infinity;
  let max = 0;
  for (const p of products) {
    for (const v of p.variants) sizes.add(v.size);
    for (const c of p.colors) colors.set(c.id, c);
    min = Math.min(min, p.price);
    max = Math.max(max, p.price);
  }
  return {
    sizes: [...sizes].sort((a, b) => a - b),
    colors: [...colors.values()].sort((a, b) => a.name.localeCompare(b.name, "es")),
    priceRange: { min: Number.isFinite(min) ? min : 0, max },
  };
}
