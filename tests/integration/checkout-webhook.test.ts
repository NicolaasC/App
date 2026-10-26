import { randomUUID } from "node:crypto";
import type postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { shippingConfig } from "@/config/shipping";
import { checkoutSchema } from "@/lib/validation/checkout";
import { createInMemoryCatalog } from "@/server/catalog/repository";
import { createPostgresCatalog } from "@/server/catalog/postgres-catalog";
import { placeCheckoutOrder, type CheckoutDeps } from "@/server/checkout/place-order";
import { createPostgresOrderRepository } from "@/server/orders/postgres-repository";
import { hashToken, verifyAccessToken } from "@/server/orders/tokens";
import { computeEventChecksum, integritySignature, type WompiEvent } from "@/server/payments/wompi";
import { createTestDatabase, seedTestCatalog, TEST_DATABASE_URL, testProduct } from "./db";

const form = (lines: { sku: string; quantity: number; expectedUnitPrice?: number }[], idempotencyKey = randomUUID()) =>
  checkoutSchema.parse({
    address: {
      firstName: "Ana",
      lastName: "Pérez",
      email: "ana@correo.com",
      phone: "3001234567",
      department: "Bogotá D. C.",
      city: "Bogotá",
      address: "Calle 72 # 10-34",
    },
    shippingMethodId: "estandar",
    paymentMethod: "wompi",
    acceptTerms: true,
    lines,
    idempotencyKey,
  });

const TOKEN_SECRET = "x".repeat(48);

describe("checkout sin backend configurado", () => {
  const deps: CheckoutDeps = {
    catalog: createInMemoryCatalog([], [testProduct()]),
    shipping: shippingConfig,
    orders: null,
    wompi: null,
    orderTokenSecret: null,
    siteUrl: "http://localhost:3000",
    reservationMinutes: 120,
  };

  it("valida y calcula el total pero no crea pedidos ni simula pagos", async () => {
    const r = await placeCheckoutOrder(form([{ sku: "TST01-NEG-38", quantity: 2, expectedUnitPrice: 200000 }]), deps);
    expect(r.status).toBe("unavailable");
    if (r.status !== "unavailable") return;
    expect(r.quote.total).toBe(412000);
    expect(r.message).toMatch(/No se creó ningún pedido/);
  });

  it("detiene la compra si el carrito cambió (precio o existencias)", async () => {
    const r = await placeCheckoutOrder(form([{ sku: "TST01-NEG-39", quantity: 3, expectedUnitPrice: 1 }]), deps);
    expect(r.status).toBe("cart_changed");
    if (r.status === "cart_changed") expect(r.issues.map((i) => i.code).sort()).toEqual(["insufficient_stock", "price_changed"]);
  });

  it("no permite cobrar productos demo con pagos de producción", async () => {
    const r = await placeCheckoutOrder(form([{ sku: "TST01-NEG-38", quantity: 1, expectedUnitPrice: 200000 }]), {
      ...deps,
      orders: { placeOrder: vi.fn(), getOrderByReference: vi.fn(), processPaymentEvent: vi.fn(), expireStaleOrders: vi.fn() },
      wompi: { publicKey: "pub_prod_x", integritySecret: "i", environment: "production" },
      orderTokenSecret: TOKEN_SECRET,
    });
    expect(r.status).toBe("unavailable");
  });
});

const run = TEST_DATABASE_URL ? describe : describe.skip;

run("flujo completo: checkout → Wompi → webhook → pedido pagado", () => {
  let sql: postgres.Sql;
  let url: string;
  const EVENTS_SECRET = "test_events_abc";
  const INTEGRITY = "test_integrity_abc";

  beforeAll(async () => {
    ({ sql, url } = await createTestDatabase("tienda_it_flow"));
  });
  afterAll(async () => {
    await sql?.end();
  });
  beforeEach(async () => {
    await sql`truncate payment_events, payments, order_items, inventory_movements, orders cascade`;
    await seedTestCatalog(sql);
  });

  function deps(): CheckoutDeps {
    return {
      catalog: createPostgresCatalog(sql),
      shipping: shippingConfig,
      orders: createPostgresOrderRepository(sql),
      wompi: { publicKey: "pub_test_abc", integritySecret: INTEGRITY, environment: "sandbox" },
      orderTokenSecret: TOKEN_SECRET,
      siteUrl: "https://tienda.example",
      reservationMinutes: 120,
    };
  }

  function signed(reference: string, status: string, amountInCents: number): WompiEvent {
    const e: WompiEvent = {
      event: "transaction.updated",
      data: { transaction: { id: `tx-${randomUUID()}`, status, amount_in_cents: amountInCents, reference, currency: "COP" } },
      environment: "test",
      signature: { properties: ["transaction.id", "transaction.status", "transaction.amount_in_cents"], checksum: "0".repeat(64) },
      timestamp: Math.floor(Date.now() / 1000),
    };
    e.signature.checksum = computeEventChecksum(e, EVENTS_SECRET);
    return e;
  }

  async function loadRoute(env: Record<string, string>) {
    vi.resetModules();
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
    return import("@/app/api/webhooks/wompi/route");
  }

  const post = (route: Awaited<ReturnType<typeof loadRoute>>, body: unknown, headers: Record<string, string> = {}) =>
    route.POST(new Request("https://tienda.example/api/webhooks/wompi", { method: "POST", body: JSON.stringify(body), headers }));

  it("crea el pedido, firma el checkout y solo el webhook verificado lo marca como pagado", async () => {
    const data = form([{ sku: "TST01-NEG-38", quantity: 1, expectedUnitPrice: 200000 }]);
    const r = await placeCheckoutOrder(data, deps());
    expect(r.status).toBe("redirect");
    if (r.status !== "redirect") return;

    const checkout = new URL(r.url);
    expect(checkout.origin).toBe("https://checkout.wompi.co");
    expect(checkout.searchParams.get("amount-in-cents")).toBe("21200000");
    expect(checkout.searchParams.get("signature:integrity")).toBe(
      integritySignature({ reference: r.reference, amountInCents: 21200000, currency: "COP", integritySecret: INTEGRITY }),
    );
    const back = new URL(checkout.searchParams.get("redirect-url")!);
    const order = await createPostgresOrderRepository(sql).getOrderByReference(r.reference);
    expect(verifyAccessToken(back.searchParams.get("t"), order!.accessTokenHash)).toBe(true);
    expect(order?.status).toBe("pending_payment");

    // Reintento con la misma clave: mismo pedido y mismo enlace de acceso.
    const again = await placeCheckoutOrder(data, deps());
    expect(again.status === "redirect" && again.reference).toBe(r.reference);
    expect(again.status === "redirect" && new URL(new URL(again.url).searchParams.get("redirect-url")!).searchParams.get("t")).toBe(back.searchParams.get("t"));

    const route = await loadRoute({ PAYMENTS_PROVIDER: "wompi", WOMPI_EVENTS_SECRET: EVENTS_SECRET, DATABASE_URL: url });

    // Firma inválida: 401 y sin cambios.
    const forged = signed(r.reference, "APPROVED", 21200000);
    forged.signature.checksum = "f".repeat(64);
    expect((await post(route, forged)).status).toBe(401);
    expect((await createPostgresOrderRepository(sql).getOrderByReference(r.reference))?.status).toBe("pending_payment");

    // Evento válido: 200 y pedido pagado. Repetido: 200 "duplicate".
    const ok = signed(r.reference, "APPROVED", 21200000);
    const res = await post(route, ok, { "x-event-checksum": ok.signature.checksum });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ result: "applied" });
    expect(await (await post(route, ok)).json()).toMatchObject({ result: "duplicate" });
    expect((await createPostgresOrderRepository(sql).getOrderByReference(r.reference))?.status).toBe("paid");
  });

  it("responde 5xx ante errores temporales para que Wompi reintente", async () => {
    const bad = new URL(url);
    bad.port = "1"; // puerto cerrado: simula caída de la base de datos
    const route = await loadRoute({ PAYMENTS_PROVIDER: "wompi", WOMPI_EVENTS_SECRET: EVENTS_SECRET, DATABASE_URL: bad.toString() });
    const res = await post(route, signed("PED-ABCDEFGH23", "APPROVED", 100));
    expect(res.status).toBe(500);
  });

  it("responde 503 si los pagos no están configurados y 400 ante JSON inválido", async () => {
    const off = await loadRoute({ PAYMENTS_PROVIDER: "none", WOMPI_EVENTS_SECRET: "", DATABASE_URL: url });
    expect((await post(off, {})).status).toBe(503);
    const on = await loadRoute({ PAYMENTS_PROVIDER: "wompi", WOMPI_EVENTS_SECRET: EVENTS_SECRET, DATABASE_URL: url });
    const res = await on.POST(new Request("https://x/api", { method: "POST", body: "{no json" }));
    expect(res.status).toBe(400);
  });

  it("el hash del token nunca es el token", () => {
    expect(hashToken("abc")).not.toContain("abc");
  });
});

describe("tarea programada de vencimiento", () => {
  it("rechaza llamadas sin el secreto correcto", async () => {
    vi.resetModules();
    vi.stubEnv("CRON_SECRET", "s".repeat(32));
    const { GET } = await import("@/app/api/cron/expirar-pedidos/route");
    expect((await GET(new Request("https://x/api/cron"))).status).toBe(401);
    expect((await GET(new Request("https://x/api/cron", { headers: { authorization: "Bearer otro" } }))).status).toBe(401);
    vi.stubEnv("DATABASE_URL", "");
    const ok = await GET(new Request("https://x/api/cron", { headers: { authorization: `Bearer ${"s".repeat(32)}` } }));
    expect(ok.status).toBe(503);
    vi.unstubAllEnvs();
  });
});
