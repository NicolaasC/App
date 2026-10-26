import type { ShippingConfig } from "@/config/shipping";
import type { CheckoutData } from "@/lib/validation/checkout";
import type { CatalogRepository } from "@/server/catalog/repository";
import type { OrderRepository } from "@/server/orders/types";
import { deriveAccessToken, generateOrderReference, hashToken } from "@/server/orders/tokens";
import { buildCheckoutUrl, integritySignature, toCents } from "@/server/payments/wompi";
import { quoteCart, type CartQuote, type QuoteIssue } from "@/server/pricing/quote";
import { quoteShipping } from "@/server/shipping/quote-shipping";

export interface CheckoutDeps {
  catalog: CatalogRepository;
  shipping: ShippingConfig;
  /** null = no hay base de datos: no se pueden crear pedidos. */
  orders: OrderRepository | null;
  /** null = no hay pasarela configurada. */
  wompi: {
    publicKey: string;
    integritySecret: string;
    environment: "sandbox" | "production";
  } | null;
  orderTokenSecret: string | null;
  siteUrl: string;
  reservationMinutes: number;
  now?: () => Date;
}

export type CheckoutResult =
  | { status: "cart_changed"; quote: CartQuote; issues: QuoteIssue[] }
  | { status: "shipping_unavailable"; message: string }
  | { status: "unavailable"; quote: CartQuote; message: string }
  | { status: "redirect"; url: string; reference: string };

const CART_CHANGED_MESSAGES = {
  not_found: "Un producto de tu carrito ya no está disponible.",
  insufficient_stock: "Un producto de tu carrito ya no tiene existencias suficientes.",
  price_changed: "El precio de un producto cambió.",
} as const;

/**
 * Flujo de compra en el servidor:
 *  1. Recalcula carrito y envío con datos del servidor.
 *  2. Si algo cambió respecto a lo que vio el cliente, se detiene y lo informa.
 *  3. Crea el pedido reservando existencias en una transacción (idempotente).
 *  4. Devuelve la URL del checkout de Wompi con firma de integridad.
 * Nunca marca el pedido como pagado: eso solo lo hace el webhook verificado.
 */
export async function placeCheckoutOrder(data: CheckoutData, deps: CheckoutDeps): Promise<CheckoutResult> {
  const shippingResult = quoteShipping(deps.shipping, data.shippingMethodId, data.address.department, 0);
  if (!shippingResult.ok) {
    return {
      status: "shipping_unavailable",
      message:
        shippingResult.reason === "no_coverage"
          ? "Todavía no hacemos envíos a ese destino."
          : "El método de entrega seleccionado no está disponible.",
    };
  }

  const quote = await quoteCart(deps.catalog, data.lines, (subtotal) => {
    const r = quoteShipping(deps.shipping, data.shippingMethodId, data.address.department, subtotal);
    return r.ok ? r.quote : null;
  });

  if (quote.issues.length || !quote.lines.length) {
    return { status: "cart_changed", quote, issues: quote.issues };
  }

  if (!deps.orders || !deps.wompi || !deps.orderTokenSecret) {
    return {
      status: "unavailable",
      quote,
      message:
        "Validamos tus datos y el total, pero los pedidos todavía no están habilitados en este sitio de demostración. No se creó ningún pedido ni se realizó ningún cobro.",
    };
  }

  if (quote.containsDemoProducts && deps.wompi.environment === "production") {
    return {
      status: "unavailable",
      quote,
      message: "Los productos de demostración no se pueden comprar con pagos reales.",
    };
  }

  const now = deps.now?.() ?? new Date();
  const reference = generateOrderReference();
  const token = deriveAccessToken(deps.orderTokenSecret, reference, data.idempotencyKey);
  const placed = await deps.orders.placeOrder({
    idempotencyKey: data.idempotencyKey,
    reference,
    accessTokenHash: hashToken(token),
    customer: {
      email: data.address.email,
      name: `${data.address.firstName} ${data.address.lastName}`,
      phone: data.address.phone,
    },
    address: {
      firstName: data.address.firstName,
      lastName: data.address.lastName,
      department: data.address.department,
      city: data.address.city,
      address: data.address.address,
      addressDetails: data.address.addressDetails,
      postalCode: data.address.postalCode,
    },
    lines: quote.lines.map((l) => ({ sku: l.sku, quantity: l.quantity, expectedUnitPrice: l.unitPrice })),
    shipping: {
      methodId: quote.shipping!.methodId,
      zoneLabel: quote.shipping!.zoneLabel,
      amount: quote.shipping!.amount,
    },
    expiresAt: new Date(now.getTime() + deps.reservationMinutes * 60_000),
  });

  if (!placed.ok) {
    // Cambió algo entre la cotización y la reserva (carrera con otro comprador).
    const fresh = await quoteCart(deps.catalog, data.lines);
    const issues = fresh.issues.length
      ? fresh.issues
      : [{ sku: placed.sku, code: placed.reason === "price_changed" ? "price_changed" : "insufficient_stock", message: CART_CHANGED_MESSAGES[placed.reason] } as QuoteIssue];
    return { status: "cart_changed", quote: fresh, issues };
  }

  const order = placed.order;
  // En un reintento idempotente se reconstruye el token con la referencia original.
  const accessToken = placed.duplicate ? deriveAccessToken(deps.orderTokenSecret, order.reference, data.idempotencyKey) : token;
  const amountInCents = toCents(order.total);
  const url = buildCheckoutUrl({
    publicKey: deps.wompi.publicKey,
    reference: order.reference,
    amountInCents,
    integritySignature: integritySignature({
      reference: order.reference,
      amountInCents,
      currency: "COP",
      integritySecret: deps.wompi.integritySecret,
    }),
    redirectUrl: `${deps.siteUrl.replace(/\/$/, "")}/pedido?referencia=${order.reference}&t=${accessToken}`,
    customerEmail: order.customerEmail,
  });
  return { status: "redirect", url, reference: order.reference };
}
