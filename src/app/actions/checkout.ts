"use server";

import { z } from "zod";
import { shippingConfig } from "@/config/shipping";
import { siteConfig } from "@/config/site";
import { checkoutSchema, cartLinesSchema, toFieldErrors, type FieldErrors } from "@/lib/validation/checkout";
import { isDepartment } from "@/lib/geo/colombia";
import { catalogRepository } from "@/server/catalog/repository";
import { placeCheckoutOrder, type CheckoutResult } from "@/server/checkout/place-order";
import { isWompiConfigured, serverEnv } from "@/server/env";
import { orderRepository } from "@/server/orders";
import { quoteCart, type CartQuote } from "@/server/pricing/quote";
import { checkRateLimit, clientKey } from "@/server/rate-limit";
import { quoteShipping } from "@/server/shipping/quote-shipping";

export type PlaceOrderResponse =
  | CheckoutResult
  | { status: "invalid"; fieldErrors: FieldErrors; message: string }
  | { status: "error"; message: string };

export async function placeOrderAction(input: unknown): Promise<PlaceOrderResponse> {
  if (!checkRateLimit(await clientKey("checkout"), 10, 60_000)) {
    return { status: "error", message: "Demasiados intentos. Espera un minuto e inténtalo de nuevo." };
  }
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", fieldErrors: toFieldErrors(parsed.error), message: "Revisa los campos marcados." };
  }

  const env = serverEnv();
  try {
    return await placeCheckoutOrder(parsed.data, {
      catalog: catalogRepository(),
      shipping: shippingConfig,
      orders: orderRepository(),
      wompi:
        isWompiConfigured(env) && env.WOMPI_PUBLIC_KEY && env.WOMPI_INTEGRITY_SECRET
          ? { publicKey: env.WOMPI_PUBLIC_KEY, integritySecret: env.WOMPI_INTEGRITY_SECRET, environment: env.WOMPI_ENVIRONMENT }
          : null,
      orderTokenSecret: env.ORDER_TOKEN_SECRET ?? null,
      siteUrl: siteConfig.url,
      reservationMinutes: env.ORDER_RESERVATION_MINUTES,
    });
  } catch (error) {
    // Sin datos personales en el log.
    console.error("placeOrderAction", error instanceof Error ? error.message : "desconocido");
    return { status: "error", message: "No pudimos procesar tu pedido. No se realizó ningún cobro. Inténtalo de nuevo." };
  }
}

const previewSchema = z.object({
  lines: cartLinesSchema,
  department: z.string().max(60),
  shippingMethodId: z.string().max(40),
});

export type CheckoutPreview =
  | { ok: true; quote: CartQuote; shippingMessage: string | null }
  | { ok: false; error: string };

/** Resumen del checkout (incluye envío según el departamento). */
export async function previewCheckoutAction(input: unknown): Promise<CheckoutPreview> {
  if (!checkRateLimit(await clientKey("preview"), 60, 60_000)) {
    return { ok: false, error: "Demasiadas solicitudes. Espera un momento." };
  }
  const parsed = previewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };
  const { lines, department, shippingMethodId } = parsed.data;
  let shippingMessage: string | null = null;
  try {
    const quote = await quoteCart(catalogRepository(), lines, (subtotal) => {
      if (!isDepartment(department)) {
        shippingMessage = "Selecciona el departamento para calcular el envío.";
        return null;
      }
      const r = quoteShipping(shippingConfig, shippingMethodId, department, subtotal);
      if (!r.ok) shippingMessage = "No hay envío disponible a ese destino.";
      return r.ok ? r.quote : null;
    });
    return { ok: true, quote, shippingMessage };
  } catch {
    return { ok: false, error: "No pudimos calcular el total. Inténtalo de nuevo." };
  }
}
