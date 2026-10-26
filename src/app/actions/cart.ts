"use server";

import { cartLinesSchema } from "@/lib/validation/checkout";
import { catalogRepository } from "@/server/catalog/repository";
import { quoteCart, type CartQuote } from "@/server/pricing/quote";
import { checkRateLimit, clientKey } from "@/server/rate-limit";

export type QuoteResponse = { ok: true; quote: CartQuote } | { ok: false; error: string };

/** Recalcula el carrito con precios y existencias del servidor. */
export async function quoteCartAction(lines: unknown): Promise<QuoteResponse> {
  if (!checkRateLimit(await clientKey("quote"), 60, 60_000)) {
    return { ok: false, error: "Demasiadas solicitudes. Espera un momento." };
  }
  const parsed = cartLinesSchema.safeParse(lines);
  if (!parsed.success) return { ok: false, error: "El carrito tiene datos inválidos." };
  try {
    return { ok: true, quote: await quoteCart(catalogRepository(), parsed.data) };
  } catch (error) {
    console.error("quoteCartAction", error instanceof Error ? error.message : "error desconocido");
    return { ok: false, error: "No pudimos actualizar el carrito. Inténtalo de nuevo." };
  }
}
