import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { ShippingConfig } from "@/config/shipping";
import type { Product } from "@/lib/catalog/types";
import { normalizeColombianPhone } from "@/lib/geo/colombia";
import { checkoutSchema, newsletterSchema, toFieldErrors } from "@/lib/validation/checkout";
import { createInMemoryCatalog } from "@/server/catalog/repository";
import { canTransitionPayment, orderEffectOfPayment } from "@/server/orders/state";
import { deriveAccessToken, generateOrderReference, hashToken, verifyAccessToken } from "@/server/orders/tokens";
import {
  buildCheckoutUrl,
  computeEventChecksum,
  integritySignature,
  mapWompiStatus,
  toPaymentEvent,
  verifyWompiEvent,
  type WompiEvent,
} from "@/server/payments/wompi";
import { quoteCart } from "@/server/pricing/quote";
import { quoteShipping } from "@/server/shipping/quote-shipping";

const base: Product = {
  id: "P1",
  slug: "p1",
  name: "Bota",
  shortDescription: "",
  description: "",
  category: "botas",
  gender: "unisex",
  price: 200000,
  colors: [{ id: "negro", name: "Negro", swatch: "#000" }],
  variants: [
    { sku: "P1-NEG-38", colorId: "negro", size: 38, stock: 5 },
    { sku: "P1-NEG-39", colorId: "negro", size: 39, stock: 1 },
    { sku: "P1-NEG-40", colorId: "negro", size: 40, stock: 0 },
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
};
const draft: Product = { ...base, id: "P2", slug: "p2", status: "draft", variants: [{ sku: "P2-NEG-38", colorId: "negro", size: 38, stock: 9 }] };
const catalog = createInMemoryCatalog([], [base, draft]);

const shipping: ShippingConfig = {
  mode: "demo",
  freeShippingThreshold: 500000,
  restrictions: [],
  methods: [
    {
      id: "estandar",
      label: "Estándar",
      carrier: null,
      zones: [
        { id: "bog", label: "Bogotá D. C.", departments: ["Bogotá D. C."], rate: 12000, estimatedTime: null },
        { id: "nal", label: "Nacional", departments: "*", rate: 18000, estimatedTime: null },
      ],
    },
  ],
};

describe("cotización en servidor", () => {
  it("usa el precio del servidor aunque el navegador envíe otro", async () => {
    const q = await quoteCart(catalog, [{ sku: "P1-NEG-38", quantity: 2, expectedUnitPrice: 1 }]);
    expect(q.subtotal).toBe(400000);
    expect(q.total).toBe(400000);
    expect(q.issues.map((i) => i.code)).toEqual(["price_changed"]);
  });

  it("ajusta cantidades a existencias y retira agotados, inexistentes y despublicados", async () => {
    const q = await quoteCart(catalog, [
      { sku: "P1-NEG-39", quantity: 3 },
      { sku: "P1-NEG-40", quantity: 1 },
      { sku: "NO-EXISTE", quantity: 1 },
      { sku: "P2-NEG-38", quantity: 1 },
    ]);
    expect(q.lines.map((l) => [l.sku, l.quantity])).toEqual([["P1-NEG-39", 1]]);
    expect(q.issues.map((i) => i.code).sort()).toEqual(["insufficient_stock", "not_found", "not_found", "unavailable"]);
    expect(q.subtotal).toBe(200000);
  });

  it("agrupa SKUs duplicados y respeta el máximo por línea", async () => {
    const big = createInMemoryCatalog([], [{ ...base, variants: [{ sku: "P1-NEG-38", colorId: "negro", size: 38, stock: 50 }] }]);
    const q = await quoteCart(big, [
      { sku: "P1-NEG-38", quantity: 8 },
      { sku: "P1-NEG-38", quantity: 8 },
    ]);
    expect(q.lines).toHaveLength(1);
    expect(q.lines[0].quantity).toBe(10);
  });

  it("calcula el envío por zona y aplica envío gratis por subtotal", async () => {
    const resolver = (dep: string) => (subtotal: number) => {
      const r = quoteShipping(shipping, "estandar", dep, subtotal);
      return r.ok ? r.quote : null;
    };
    const bog = await quoteCart(catalog, [{ sku: "P1-NEG-38", quantity: 1 }], resolver("Bogotá D. C."));
    expect(bog.shipping?.amount).toBe(12000);
    expect(bog.total).toBe(212000);
    const nal = await quoteCart(catalog, [{ sku: "P1-NEG-38", quantity: 1 }], resolver("Antioquia"));
    expect(nal.total).toBe(218000);
    const free = await quoteCart(catalog, [{ sku: "P1-NEG-38", quantity: 3 }], resolver("Antioquia"));
    expect(free.shipping).toMatchObject({ amount: 0, freeShippingApplied: true });
    expect(free.total).toBe(600000);
  });

  it("rechaza métodos inexistentes y envíos deshabilitados", () => {
    expect(quoteShipping(shipping, "express", "Meta", 0)).toEqual({ ok: false, reason: "unknown_method" });
    expect(quoteShipping({ ...shipping, mode: "disabled" }, "estandar", "Meta", 0)).toEqual({ ok: false, reason: "disabled" });
    const noNational = { ...shipping, methods: [{ ...shipping.methods[0], zones: [shipping.methods[0].zones[0]] }] };
    expect(quoteShipping(noNational, "estandar", "Meta", 0)).toEqual({ ok: false, reason: "no_coverage" });
  });
});

describe("validación del checkout", () => {
  const valid = {
    address: {
      firstName: "Ana",
      lastName: "Pérez",
      email: " Ana@Correo.COM ",
      phone: "+57 300 123 4567",
      department: "Bogotá D. C.",
      city: "Bogotá",
      address: "Calle 72 # 10-34",
    },
    shippingMethodId: "estandar",
    paymentMethod: "wompi",
    acceptTerms: true,
    lines: [{ sku: "P1-NEG-38", quantity: 1 }],
    idempotencyKey: "3f0c8a7e-2b1d-4c5e-9f6a-7b8c9d0e1f2a",
  };

  it("acepta y normaliza datos válidos", () => {
    const r = checkoutSchema.parse(valid);
    expect(r.address.email).toBe("ana@correo.com");
    expect(r.address.phone).toBe("3001234567");
    expect(r.address.addressDetails).toBe("");
  });

  it("devuelve errores claros en español por campo", () => {
    const r = checkoutSchema.safeParse({
      ...valid,
      address: { ...valid.address, email: "ana@", phone: "123", department: "Narnia", address: "Calle sin número", postalCode: "12" },
      acceptTerms: false,
      lines: [],
    });
    expect(r.success).toBe(false);
    const errors = toFieldErrors(r.error!);
    expect(Object.keys(errors).sort()).toEqual([
      "acceptTerms",
      "address.address",
      "address.department",
      "address.email",
      "address.phone",
      "address.postalCode",
      "lines",
    ]);
    expect(errors["address.phone"]).toMatch(/10 dígitos/);
  });

  it("rechaza cantidades manipuladas", () => {
    expect(checkoutSchema.safeParse({ ...valid, lines: [{ sku: "X", quantity: 11 }] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, lines: [{ sku: "X", quantity: 0 }] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, lines: [{ sku: "X", quantity: 1.5 }] }).success).toBe(false);
  });

  it("teléfonos colombianos", () => {
    expect(normalizeColombianPhone("300-123-4567")).toBe("3001234567");
    expect(normalizeColombianPhone("601 234 5678")).toBe("6012345678");
    expect(normalizeColombianPhone("573001234567")).toBe("3001234567");
    expect(normalizeColombianPhone("1234567")).toBeNull();
    expect(normalizeColombianPhone("2001234567")).toBeNull();
  });

  it("el boletín exige consentimiento explícito", () => {
    expect(newsletterSchema.safeParse({ email: "a@b.co", consent: false }).success).toBe(false);
    expect(newsletterSchema.safeParse({ email: "a@b.co", consent: true }).success).toBe(true);
  });
});

describe("Wompi", () => {
  const secret = "test_events_secret";

  function signedEvent(overrides: Partial<WompiEvent["data"]["transaction"]> = {}, timestamp = 1_800_000_000): WompiEvent {
    const event: WompiEvent = {
      event: "transaction.updated",
      data: {
        transaction: { id: "1234-1610641025-49201", status: "APPROVED", amount_in_cents: 21200000, reference: "PED-ABCDEFGH23", currency: "COP", ...overrides },
      },
      environment: "test",
      signature: { properties: ["transaction.id", "transaction.status", "transaction.amount_in_cents"], checksum: "0".repeat(64) },
      timestamp,
    };
    event.signature.checksum = computeEventChecksum(event, secret);
    return event;
  }

  it("calcula el checksum como indica la documentación", () => {
    const e = signedEvent();
    const manual = createHash("sha256").update(`1234-1610641025-49201APPROVED21200000${e.timestamp}${secret}`).digest("hex");
    expect(e.signature.checksum).toBe(manual);
  });

  it("acepta eventos con firma válida", () => {
    const e = signedEvent();
    expect(verifyWompiEvent(e, secret, { headerChecksum: e.signature.checksum.toUpperCase() }).ok).toBe(true);
  });

  it("rechaza eventos alterados, sin secreto o con cabecera distinta", () => {
    const e = signedEvent();
    const tampered = structuredClone(e);
    tampered.data.transaction.amount_in_cents = 100;
    expect(verifyWompiEvent(tampered, secret)).toEqual({ ok: false, reason: "invalid_signature" });
    expect(verifyWompiEvent(e, "")).toEqual({ ok: false, reason: "missing_secret" });
    expect(verifyWompiEvent(e, "otro")).toEqual({ ok: false, reason: "invalid_signature" });
    expect(verifyWompiEvent(e, secret, { headerChecksum: "a".repeat(64) })).toEqual({ ok: false, reason: "invalid_signature" });
    expect(verifyWompiEvent({ foo: 1 }, secret)).toEqual({ ok: false, reason: "invalid_payload" });
    expect(verifyWompiEvent(e, secret, { now: e.timestamp + 10_000, maxAgeSeconds: 3600 })).toEqual({ ok: false, reason: "stale_timestamp" });
  });

  it("normaliza el evento sin datos personales", () => {
    const pe = toPaymentEvent(signedEvent())!;
    expect(pe).toMatchObject({ status: "approved", amountCop: 212000, reference: "PED-ABCDEFGH23" });
    expect(JSON.stringify(pe.payload)).not.toMatch(/email/);
    expect(mapWompiStatus("DECLINED")).toBe("declined");
    expect(mapWompiStatus("RARO")).toBeNull();
    expect(toPaymentEvent({ ...signedEvent(), event: "nequi_token.updated" })).toBeNull();
  });

  it("genera la firma de integridad y la URL de checkout", () => {
    const sig = integritySignature({ reference: "PED-ABCDEFGH23", amountInCents: 21200000, currency: "COP", integritySecret: "integ" });
    expect(sig).toBe(createHash("sha256").update("PED-ABCDEFGH2321200000COPinteg").digest("hex"));
    expect(() => integritySignature({ reference: "x", amountInCents: 1, currency: "COP", integritySecret: "" })).toThrow();
    const url = new URL(buildCheckoutUrl({ publicKey: "pub_test_x", reference: "PED-ABCDEFGH23", amountInCents: 21200000, integritySignature: sig, redirectUrl: "https://tienda.co/pedido?referencia=PED-ABCDEFGH23&t=abc" }));
    expect(url.searchParams.get("signature:integrity")).toBe(sig);
    expect(url.searchParams.get("redirect-url")).toContain("t=abc");
  });
});

describe("estados de pedido y pago", () => {
  it("separa estados y define transiciones", () => {
    expect(canTransitionPayment("pending", "approved")).toBe(true);
    expect(canTransitionPayment("approved", "pending")).toBe(false);
    expect(canTransitionPayment("declined", "approved")).toBe(false);
    expect(orderEffectOfPayment("pending_payment", "approved")).toEqual({ status: "paid", releaseStock: false });
    expect(orderEffectOfPayment("pending_payment", "declined")).toEqual({ status: "payment_failed", releaseStock: true });
    expect(orderEffectOfPayment("paid", "voided")).toEqual({ status: "refunded", releaseStock: false });
    expect(orderEffectOfPayment("shipped", "approved")).toBeNull();
  });
});

describe("tokens de acceso al pedido", () => {
  const secret = "s".repeat(40);
  it("solo el token correcto da acceso", () => {
    const token = deriveAccessToken(secret, "PED-ABCDEFGH23", "key-1");
    const hash = hashToken(token);
    expect(verifyAccessToken(token, hash)).toBe(true);
    expect(verifyAccessToken(deriveAccessToken(secret, "PED-ABCDEFGH23", "key-2"), hash)).toBe(false);
    expect(verifyAccessToken("", hash)).toBe(false);
    expect(verifyAccessToken(null, hash)).toBe(false);
    expect(verifyAccessToken(token, "no-es-hash")).toBe(false);
    expect(() => deriveAccessToken("corto", "r", "k")).toThrow();
  });
  it("las referencias tienen el formato esperado y no se repiten", () => {
    const refs = new Set(Array.from({ length: 500 }, generateOrderReference));
    expect(refs.size).toBe(500);
    for (const r of refs) expect(r).toMatch(/^PED-[A-Z0-9]{10}$/);
  });
});
