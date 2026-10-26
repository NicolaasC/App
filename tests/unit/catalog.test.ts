import { describe, expect, it } from "vitest";
import { demoProducts } from "@/data/demo/products";
import { formatCOP } from "@/lib/format";
import {
  applyFilters,
  countActiveFilters,
  EMPTY_FILTERS,
  facetOptions,
  normalizeText,
  parseFilters,
  serializeFilters,
} from "@/lib/catalog/filters";
import {
  availabilityOf,
  clampQuantity,
  defaultColorId,
  findVariant,
  maxOrderable,
  MAX_QUANTITY_PER_LINE,
  sizeOptions,
} from "@/lib/catalog/variants";
import { footLengthCm } from "@/lib/catalog/sizes";
import type { Product } from "@/lib/catalog/types";

const nbsp = (s: string) => s.replace(/ /g, " ");

describe("formatCOP", () => {
  it("formatea enteros sin decimales", () => {
    expect(nbsp(formatCOP(329900))).toBe("$ 329.900");
    expect(nbsp(formatCOP(0))).toBe("$ 0");
    expect(nbsp(formatCOP(1250000))).toBe("$ 1.250.000");
  });
  it("muestra decimales solo cuando existen", () => {
    expect(nbsp(formatCOP(1500.5))).toBe("$ 1.500,50");
  });
  it("rechaza valores no finitos", () => {
    expect(() => formatCOP(Number.NaN)).toThrow();
  });
});

function product(overrides: Partial<Product>): Product {
  return {
    id: "T1",
    slug: "t1",
    name: "Prueba",
    shortDescription: "",
    description: "",
    category: "botas",
    gender: "unisex",
    price: 100000,
    colors: [
      { id: "negro", name: "Negro", swatch: "#000" },
      { id: "cafe", name: "Café", swatch: "#630" },
    ],
    variants: [
      { sku: "T1-NEG-38", colorId: "negro", size: 38, stock: 0 },
      { sku: "T1-NEG-39", colorId: "negro", size: 39, stock: 4 },
      { sku: "T1-CAF-38", colorId: "cafe", size: 38, stock: 2 },
    ],
    materials: [],
    images: [],
    collections: [],
    featured: false,
    isNew: false,
    publishedAt: "2026-01-01",
    status: "published",
    rank: 1,
    isDemo: true,
    ...overrides,
  };
}

describe("filtros del catálogo", () => {
  const a = product({ id: "A", slug: "a", name: "Bota Andina", price: 400000, category: "botas", gender: "hombre", publishedAt: "2026-05-01", rank: 5 });
  const b = product({ id: "B", slug: "b", name: "Sandalia Prado", price: 150000, category: "sandalias", gender: "mujer", publishedAt: "2026-09-01", rank: 9 });
  const c = product({
    id: "C",
    slug: "c",
    name: "Tenis Ciudad",
    price: 290000,
    category: "sneakers",
    publishedAt: "2026-07-01",
    rank: 7,
    variants: [{ sku: "C-BLA-40", colorId: "negro", size: 40, stock: 0 }],
  });
  const all = [a, b, c];

  it("combina categoría, precio y búsqueda", () => {
    const f = { ...EMPTY_FILTERS, categories: ["botas", "sandalias"] as const, maxPrice: 200000 };
    expect(applyFilters(all, { ...f, categories: [...f.categories] }).map((p) => p.id)).toEqual(["B"]);
    expect(applyFilters(all, { ...EMPTY_FILTERS, q: "andina" }).map((p) => p.id)).toEqual(["A"]);
  });

  it("busca sin tildes ni mayúsculas", () => {
    expect(normalizeText("  CAFÉ Niño ")).toBe("cafe nino");
    expect(applyFilters(all, { ...EMPTY_FILTERS, q: "cafe" }).length).toBe(3);
  });

  it("talla y color deben coincidir en la misma variante", () => {
    // A tiene negro 38 (sin stock) y café 38 (con stock).
    const f = { ...EMPTY_FILTERS, sizes: [38], colors: ["negro"], inStockOnly: true };
    expect(applyFilters([a], f)).toHaveLength(0);
    expect(applyFilters([a], { ...f, colors: ["cafe"] })).toHaveLength(1);
    expect(applyFilters([a], { ...f, inStockOnly: false })).toHaveLength(1);
  });

  it("ordena por precio y novedades", () => {
    expect(applyFilters(all, { ...EMPTY_FILTERS, sort: "precio-asc" }).map((p) => p.id)).toEqual(["B", "C", "A"]);
    expect(applyFilters(all, { ...EMPTY_FILTERS, sort: "precio-desc" }).map((p) => p.id)).toEqual(["A", "C", "B"]);
    expect(applyFilters(all, { ...EMPTY_FILTERS, sort: "novedades" }).map((p) => p.id)).toEqual(["B", "C", "A"]);
  });

  it("relevancia pone los agotados al final", () => {
    expect(applyFilters(all, EMPTY_FILTERS).map((p) => p.id)).toEqual(["B", "A", "C"]);
  });

  it("excluye productos no publicados", () => {
    expect(applyFilters([product({ status: "draft" })], EMPTY_FILTERS)).toHaveLength(0);
  });

  it("lee y escribe la URL de forma simétrica e ignora valores inválidos", () => {
    const params = new URLSearchParams("categoria=botas,inventada&talla=38,abc,99&color=negro&min=500000&max=100000&orden=hack&q=bota&disponible=1");
    const f = parseFilters(params);
    expect(f.categories).toEqual(["botas"]);
    expect(f.sizes).toEqual([38]);
    expect(f.minPrice).toBe(100000);
    expect(f.maxPrice).toBe(500000);
    expect(f.sort).toBe("relevancia");
    expect(f.inStockOnly).toBe(true);
    expect(parseFilters(serializeFilters(f))).toEqual(f);
    expect(countActiveFilters(f)).toBe(6);
    expect(serializeFilters(EMPTY_FILTERS).toString()).toBe("");
  });

  it("las facetas salen del catálogo", () => {
    const facets = facetOptions(all);
    expect(facets.sizes).toEqual([38, 39, 40]);
    expect(facets.priceRange).toEqual({ min: 150000, max: 400000 });
  });
});

describe("variantes e inventario", () => {
  const p = product({});

  it("solo ofrece tallas que existen para el color", () => {
    expect(sizeOptions(p, "cafe").map((o) => o.size)).toEqual([38]);
    expect(sizeOptions(p, "negro").map((o) => [o.size, o.availability])).toEqual([
      [38, "out_of_stock"],
      [39, "in_stock"],
    ]);
    expect(findVariant(p, "cafe", 39)).toBeUndefined();
  });

  it("elige por defecto un color con existencias", () => {
    const soldOutFirst = product({
      variants: [
        { sku: "X-NEG-38", colorId: "negro", size: 38, stock: 0 },
        { sku: "X-CAF-38", colorId: "cafe", size: 38, stock: 3 },
      ],
    });
    expect(defaultColorId(soldOutFirst)).toBe("cafe");
  });

  it("limita cantidades a existencias y máximo por línea", () => {
    expect(availabilityOf(2)).toBe("low_stock");
    expect(maxOrderable(4)).toBe(4);
    expect(maxOrderable(4, 3)).toBe(1);
    expect(maxOrderable(50)).toBe(MAX_QUANTITY_PER_LINE);
    expect(maxOrderable(0)).toBe(0);
    expect(clampQuantity(9, 4)).toBe(4);
    expect(clampQuantity(-3, 4)).toBe(1);
    expect(clampQuantity(Number.NaN, 4)).toBe(1);
  });

  it("guía de tallas aproximada", () => {
    expect(footLengthCm(38)).toBe(23.8);
    expect(footLengthCm(42)).toBe(26.5);
  });
});

describe("datos de demostración", () => {
  it("son coherentes", () => {
    const slugs = new Set<string>();
    const skus = new Set<string>();
    const photos = new Set<string>();
    for (const p of demoProducts) {
      expect(p.isDemo).toBe(true);
      expect(slugs.has(p.slug)).toBe(false);
      slugs.add(p.slug);
      expect(Number.isInteger(p.price) && p.price > 0).toBe(true);
      expect(p.compareAtPrice).toBeUndefined(); // sin descuentos inventados
      for (const v of p.variants) {
        expect(skus.has(v.sku)).toBe(false);
        skus.add(v.sku);
        expect(p.colors.some((c) => c.id === v.colorId)).toBe(true);
        expect(v.stock).toBeGreaterThanOrEqual(0);
      }
      // Una foto distinta por producto (nunca la misma imagen para modelos diferentes).
      for (const img of p.images) {
        expect(photos.has(img.credit.sourceUrl)).toBe(false);
        photos.add(img.credit.sourceUrl);
        expect(img.alt.length).toBeGreaterThan(5);
      }
    }
  });
});
