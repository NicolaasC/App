import { randomUUID } from "node:crypto";
import type postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPostgresCatalog } from "@/server/catalog/postgres-catalog";
import { createPostgresOrderRepository } from "@/server/orders/postgres-repository";
import { generateOrderReference, hashToken } from "@/server/orders/tokens";
import type { NewOrderInput, OrderRepository, PaymentEvent } from "@/server/orders/types";
import { createTestDatabase, seedTestCatalog, TEST_DATABASE_URL, testProduct } from "./db";

const run = TEST_DATABASE_URL ? describe : describe.skip;

run("pedidos en PostgreSQL", () => {
  let sql: postgres.Sql;
  let repo: OrderRepository;

  beforeAll(async () => {
    ({ sql } = await createTestDatabase("tienda_it_orders"));
    repo = createPostgresOrderRepository(sql);
  });
  afterAll(async () => {
    await sql?.end();
  });
  beforeEach(async () => {
    await sql`truncate payment_events, payments, order_items, inventory_movements, orders cascade`;
    await seedTestCatalog(sql);
  });

  const stock = async (sku: string) => (await sql`select stock from variants where sku = ${sku}`)[0].stock as number;

  function input(lines: NewOrderInput["lines"], overrides: Partial<NewOrderInput> = {}): NewOrderInput {
    return {
      idempotencyKey: randomUUID(),
      reference: generateOrderReference(),
      accessTokenHash: hashToken("token"),
      customer: { email: "ana@correo.com", name: "Ana Pérez", phone: "3001234567" },
      address: { firstName: "Ana", lastName: "Pérez", department: "Bogotá D. C.", city: "Bogotá", address: "Calle 72 # 10-34", addressDetails: "", postalCode: "" },
      lines,
      shipping: { methodId: "estandar", zoneLabel: "Bogotá D. C.", amount: 12000 },
      expiresAt: new Date(Date.now() + 3600_000),
      ...overrides,
    };
  }

  function event(reference: string, status: PaymentEvent["status"], amountCop: number, key: string = randomUUID()): PaymentEvent {
    return {
      provider: "wompi",
      eventKey: key,
      eventType: "transaction.updated",
      reference,
      transactionId: `tx-${reference}`,
      status,
      amountCop,
      currency: "COP",
      statusDetail: null,
      payload: { test: true },
    };
  }

  it("crea el pedido con totales del servidor y reserva existencias", async () => {
    const r = await repo.placeOrder(input([{ sku: "TST01-NEG-38", quantity: 2, expectedUnitPrice: 200000 }]));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.order).toMatchObject({ status: "pending_payment", paymentStatus: "pending", subtotal: 400000, shipping: 12000, total: 412000, isDemo: true });
    expect(await stock("TST01-NEG-38")).toBe(1);
    const [mov] = await sql`select delta, reason from inventory_movements`;
    expect(mov).toMatchObject({ delta: -2, reason: "order_reserved" });
  });

  it("rechaza existencias insuficientes y precios desactualizados sin tocar inventario", async () => {
    expect(await repo.placeOrder(input([{ sku: "TST01-NEG-39", quantity: 2, expectedUnitPrice: 200000 }]))).toMatchObject({ ok: false, reason: "insufficient_stock" });
    expect(await repo.placeOrder(input([{ sku: "TST01-NEG-38", quantity: 1, expectedUnitPrice: 1000 }]))).toMatchObject({ ok: false, reason: "price_changed" });
    expect(await repo.placeOrder(input([{ sku: "NO-EXISTE", quantity: 1, expectedUnitPrice: 1 }]))).toMatchObject({ ok: false, reason: "not_found" });
    expect(await stock("TST01-NEG-38")).toBe(3);
    expect((await sql`select count(*)::int as n from orders`)[0].n).toBe(0);
  });

  it("no crea pedidos de productos despublicados", async () => {
    await seedTestCatalog(sql, [testProduct({ status: "draft" })]);
    expect(await repo.placeOrder(input([{ sku: "TST01-NEG-38", quantity: 1, expectedUnitPrice: 200000 }]))).toMatchObject({ ok: false, reason: "not_found" });
  });

  it("es idempotente ante doble envío (secuencial y simultáneo)", async () => {
    const data = input([{ sku: "TST01-NEG-38", quantity: 1, expectedUnitPrice: 200000 }]);
    const [a, b] = await Promise.all([repo.placeOrder(data), repo.placeOrder({ ...data, reference: generateOrderReference() })]);
    const c = await repo.placeOrder({ ...data, reference: generateOrderReference() });
    const refs = [a, b, c].map((r) => (r.ok ? r.order.reference : null));
    expect(new Set(refs).size).toBe(1);
    expect([a, b, c].filter((r) => r.ok && r.duplicate)).toHaveLength(2);
    expect(await stock("TST01-NEG-38")).toBe(2);
  });

  it("dos compradores por la última unidad: solo uno la obtiene", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => repo.placeOrder(input([{ sku: "TST01-NEG-39", quantity: 1, expectedUnitPrice: 200000 }]))),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok && r.reason === "insufficient_stock")).toHaveLength(4);
    expect(await stock("TST01-NEG-39")).toBe(0);
  });

  describe("eventos de pago", () => {
    async function newOrder() {
      const r = await repo.placeOrder(input([{ sku: "TST01-NEG-38", quantity: 1, expectedUnitPrice: 200000 }]));
      if (!r.ok) throw new Error("no se creó");
      return r.order;
    }

    it("aprobado marca el pedido como pagado; el evento repetido no se aplica dos veces", async () => {
      const order = await newOrder();
      const e = event(order.reference, "approved", order.total, "evt-1");
      expect(await repo.processPaymentEvent(e)).toBe("applied");
      expect(await repo.processPaymentEvent(e)).toBe("duplicate");
      const after = await repo.getOrderByReference(order.reference);
      expect(after).toMatchObject({ status: "paid", paymentStatus: "approved" });
      expect((await sql`select count(*)::int as n from payment_events`)[0].n).toBe(1);
    });

    it("pendiente y luego rechazado libera las existencias", async () => {
      const order = await newOrder();
      expect(await stock("TST01-NEG-38")).toBe(2);
      expect(await repo.processPaymentEvent(event(order.reference, "pending", order.total))).toBe("stale");
      expect(await repo.processPaymentEvent(event(order.reference, "declined", order.total))).toBe("applied");
      expect(await repo.getOrderByReference(order.reference)).toMatchObject({ status: "payment_failed", paymentStatus: "declined" });
      expect(await stock("TST01-NEG-38")).toBe(3);
    });

    it("ignora eventos fuera de orden (pendiente después de aprobado)", async () => {
      const order = await newOrder();
      await repo.processPaymentEvent(event(order.reference, "approved", order.total));
      expect(await repo.processPaymentEvent(event(order.reference, "pending", order.total))).toBe("stale");
      expect(await repo.processPaymentEvent(event(order.reference, "declined", order.total))).toBe("stale");
      expect(await repo.getOrderByReference(order.reference)).toMatchObject({ status: "paid" });
    });

    it("un monto distinto no marca el pedido como pagado y pide revisión", async () => {
      const order = await newOrder();
      expect(await repo.processPaymentEvent(event(order.reference, "approved", 1000))).toBe("amount_mismatch");
      const [row] = await sql`select status, needs_review from orders where reference = ${order.reference}`;
      expect(row).toMatchObject({ status: "pending_payment", needs_review: true });
    });

    it("referencia desconocida se registra sin efectos", async () => {
      expect(await repo.processPaymentEvent(event("PED-NOEXISTE1", "approved", 1))).toBe("unknown_reference");
    });

    it("los pedidos vencidos se cancelan, liberan stock y un pago tardío queda en revisión", async () => {
      const order = await newOrder();
      expect(await repo.expireStaleOrders(new Date(Date.now() + 2 * 3600_000))).toBe(1);
      expect(await stock("TST01-NEG-38")).toBe(3);
      expect(await repo.getOrderByReference(order.reference)).toMatchObject({ status: "cancelled", paymentStatus: "voided" });
      expect(await repo.processPaymentEvent(event(order.reference, "approved", order.total))).toBe("needs_review");
      const [row] = await sql`select needs_review from orders where reference = ${order.reference}`;
      expect(row.needs_review).toBe(true);
    });
  });

  describe("restricciones de la base de datos", () => {
    it("impide existencias negativas y totales incoherentes", async () => {
      await expect(sql`update variants set stock = -1 where sku = 'TST01-NEG-38'`).rejects.toThrow(/check/);
      const r = await repo.placeOrder(input([{ sku: "TST01-NEG-38", quantity: 1, expectedUnitPrice: 200000 }]));
      if (!r.ok) throw new Error("no se creó");
      await expect(sql`update orders set total_cop = 1 where reference = ${r.order.reference}`).rejects.toThrow(/total_matches/);
    });
  });

  describe("seguridad a nivel de filas (roles públicos de Supabase)", () => {
    async function asRole<T>(role: "anon" | "authenticated", fn: (tx: postgres.TransactionSql) => Promise<T>, userId?: string) {
      return sql.begin(async (tx) => {
        await tx.unsafe(`set local role ${role}`);
        if (userId) await tx`select set_config('request.jwt.claim.sub', ${userId}, true)`;
        return fn(tx);
      });
    }

    it("anon lee el catálogo publicado pero no borradores", async () => {
      await seedTestCatalog(sql, [testProduct(), testProduct({ id: "TST02", slug: "borrador", status: "draft", variants: [{ sku: "TST02-NEG-38", colorId: "negro", size: 38, stock: 1 }] })]);
      const rows = await asRole("anon", (tx) => tx`select slug from products order by slug`);
      expect(rows.map((r) => r.slug)).toEqual(["bota-prueba"]);
    });

    it("anon no puede cambiar precios ni existencias ni leer pedidos", async () => {
      await repo.placeOrder(input([{ sku: "TST01-NEG-38", quantity: 1, expectedUnitPrice: 200000 }]));
      const updated = await asRole("anon", (tx) => tx`update products set price_cop = 1 returning id`);
      expect(updated).toHaveLength(0);
      const stockUpd = await asRole("anon", (tx) => tx`update variants set stock = 999 returning id`);
      expect(stockUpd).toHaveLength(0);
      expect(await asRole("anon", (tx) => tx`select * from orders`)).toHaveLength(0);
      expect(await asRole("authenticated", (tx) => tx`select * from orders`, randomUUID())).toHaveLength(0);
      await expect(asRole("anon", (tx) => tx`insert into admin_users (user_id, role) values (${randomUUID()}, 'admin')`)).rejects.toThrow(/row-level security/);
      const [p] = await sql`select price_cop from products where code = 'TST01'`;
      expect(p.price_cop).toBe(200000);
    });

    it("un administrador autenticado puede gestionar el catálogo y leer pedidos", async () => {
      const adminId = randomUUID();
      await sql`insert into auth.users (id, email) values (${adminId}, 'admin@tienda.co')`;
      await sql`insert into admin_users (user_id, role) values (${adminId}, 'admin')`;
      await repo.placeOrder(input([{ sku: "TST01-NEG-38", quantity: 1, expectedUnitPrice: 200000 }]));
      const upd = await asRole("authenticated", (tx) => tx`update products set rank = 99 where code = 'TST01' returning id`, adminId);
      expect(upd).toHaveLength(1);
      expect(await asRole("authenticated", (tx) => tx`select id from orders`, adminId)).toHaveLength(1);
    });
  });

  it("el catálogo de PostgreSQL devuelve la misma forma que el de demostración", async () => {
    const catalog = createPostgresCatalog(sql);
    const product = await catalog.getProductBySlug("bota-prueba");
    expect(product).toMatchObject({ id: "TST01", price: 200000, category: "botas", colors: [{ id: "negro" }] });
    expect(product?.variants.map((v) => [v.sku, v.colorId, v.size])).toEqual([
      ["TST01-NEG-38", "negro", 38],
      ["TST01-NEG-39", "negro", 39],
    ]);
    const found = await catalog.findVariants(["TST01-NEG-39", "NO"]);
    expect([...found.keys()]).toEqual(["TST01-NEG-39"]);
  });
});
