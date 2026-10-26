import type { Availability, Product, Variant } from "./types";

export const LOW_STOCK_THRESHOLD = 2;
/** Máximo de unidades por variante en un pedido, aunque haya más existencias. */
export const MAX_QUANTITY_PER_LINE = 10;

export function findVariant(product: Product, colorId: string, size: number): Variant | undefined {
  return product.variants.find((v) => v.colorId === colorId && v.size === size);
}

export function findVariantBySku(product: Product, sku: string): Variant | undefined {
  return product.variants.find((v) => v.sku === sku);
}

export function availabilityOf(stock: number): Availability {
  if (stock <= 0) return "out_of_stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

export function productStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
}

export function productAvailability(product: Product): Availability {
  return productStock(product) > 0 ? "in_stock" : "out_of_stock";
}

/** Tallas del producto (todas, ordenadas), para un color concreto o para todos. */
export function sizesFor(product: Product, colorId?: string): number[] {
  const sizes = new Set(
    product.variants.filter((v) => !colorId || v.colorId === colorId).map((v) => v.size),
  );
  return [...sizes].sort((a, b) => a - b);
}

export interface SizeOption {
  size: number;
  sku: string;
  stock: number;
  availability: Availability;
}

/** Opciones de talla para un color: solo tallas que existen como variante. */
export function sizeOptions(product: Product, colorId: string): SizeOption[] {
  return product.variants
    .filter((v) => v.colorId === colorId)
    .sort((a, b) => a.size - b.size)
    .map((v) => ({ size: v.size, sku: v.sku, stock: v.stock, availability: availabilityOf(v.stock) }));
}

/** Color inicial: el primero con existencias, o el primero si todo está agotado. */
export function defaultColorId(product: Product): string {
  const withStock = product.colors.find((c) =>
    product.variants.some((v) => v.colorId === c.id && v.stock > 0),
  );
  return (withStock ?? product.colors[0]).id;
}

/** Cantidad máxima que se puede pedir de una variante, considerando lo que ya hay en el carrito. */
export function maxOrderable(stock: number, alreadyInCart = 0): number {
  return Math.max(0, Math.min(stock, MAX_QUANTITY_PER_LINE) - alreadyInCart);
}

export function clampQuantity(requested: number, stock: number): number {
  if (!Number.isFinite(requested)) return 1;
  return Math.max(1, Math.min(Math.trunc(requested), Math.max(1, maxOrderable(stock))));
}

export function imagesForColor(product: Product, colorId: string) {
  return product.images.filter((img) => !img.colorId || img.colorId === colorId);
}
