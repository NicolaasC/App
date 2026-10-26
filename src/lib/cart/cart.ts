import { z } from "zod";
import { MAX_QUANTITY_PER_LINE } from "@/lib/catalog/variants";
import { EMPTY_CART, type CartItem, type CartState } from "./types";

export const CART_STORAGE_KEY = "tienda-calzado:cart:v1";
export const MAX_CART_LINES = 30;

const itemSchema = z.object({
  sku: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
  snapshot: z.object({
    productSlug: z.string().max(120),
    name: z.string().max(120),
    colorName: z.string().max(60),
    size: z.number(),
    unitPrice: z.number().nonnegative(),
    imageId: z.string().max(80).nullable(),
  }),
  addedAt: z.number(),
});

const stateSchema = z.object({
  version: z.literal(1),
  items: z.array(z.unknown()),
});

/** Lee un carrito guardado tolerando datos corruptos o manipulados. */
export function parseStoredCart(raw: string | null): CartState {
  if (!raw) return EMPTY_CART;
  try {
    const parsed = stateSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return EMPTY_CART;
    const items: CartItem[] = [];
    const seen = new Set<string>();
    for (const candidate of parsed.data.items) {
      const item = itemSchema.safeParse(candidate);
      if (item.success && !seen.has(item.data.sku)) {
        seen.add(item.data.sku);
        items.push(item.data);
      }
    }
    return { version: 1, items: items.slice(0, MAX_CART_LINES) };
  } catch {
    return EMPTY_CART;
  }
}

export interface AddItemResult {
  state: CartState;
  /** Cantidad realmente agregada (puede ser menor a la pedida por existencias). */
  added: number;
  limited: boolean;
}

/**
 * Agrega unidades sin superar `maxAvailable` (existencias conocidas en el
 * momento) ni el máximo por línea.
 */
export function addItem(
  state: CartState,
  item: Omit<CartItem, "addedAt" | "quantity">,
  quantity: number,
  maxAvailable: number,
  now = Date.now(),
): AddItemResult {
  const cap = Math.max(0, Math.min(maxAvailable, MAX_QUANTITY_PER_LINE));
  const existing = state.items.find((i) => i.sku === item.sku);
  const current = existing?.quantity ?? 0;
  const requested = Math.max(0, Math.trunc(quantity));
  const next = Math.min(current + requested, cap);
  const added = Math.max(0, next - current);

  if (added === 0) return { state, added: 0, limited: requested > 0 };
  if (!existing && state.items.length >= MAX_CART_LINES) return { state, added: 0, limited: true };

  const items = existing
    ? state.items.map((i) => (i.sku === item.sku ? { ...i, quantity: next, snapshot: item.snapshot } : i))
    : [...state.items, { ...item, quantity: next, addedAt: now }];
  return { state: { version: 1, items }, added, limited: added < requested };
}

export function setQuantity(state: CartState, sku: string, quantity: number): CartState {
  const q = Math.trunc(quantity);
  if (q <= 0) return removeItem(state, sku);
  return {
    version: 1,
    items: state.items.map((i) =>
      i.sku === sku ? { ...i, quantity: Math.min(q, MAX_QUANTITY_PER_LINE) } : i,
    ),
  };
}

export function removeItem(state: CartState, sku: string): CartState {
  return { version: 1, items: state.items.filter((i) => i.sku !== sku) };
}

export function itemCount(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.quantity, 0);
}

/** Subtotal ESTIMADO con precios guardados. Solo para mostrar mientras llega la cotización. */
export function estimatedSubtotal(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.snapshot.unitPrice * i.quantity, 0);
}
