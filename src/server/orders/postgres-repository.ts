import type { Sql, Tx } from "@/server/db";
import { canTransitionPayment, orderEffectOfPayment } from "./state";
import type {
  OrderRepository,
  OrderStatus,
  OrderSummary,
  PaymentEvent,
  PaymentEventResult,
  PaymentStatus,
  PlaceOrderResult,
} from "./types";

const UNIQUE_VIOLATION = "23505";

class OrderRejected extends Error {
  constructor(readonly result: Extract<PlaceOrderResult, { ok: false }>) {
    super(result.reason);
  }
}

/**
 * Repositorio de pedidos sobre PostgreSQL. Cada operación es una transacción:
 * las existencias se bloquean (FOR UPDATE) antes de descontarse y los precios
 * se vuelven a leer de la base de datos, no del navegador.
 */
export function createPostgresOrderRepository(sql: Sql): OrderRepository {
  async function findOrder(db: Sql | Tx, column: "reference" | "idempotency_key", value: string) {
    const rows = await db`
      select o.*, (
        select p.status from payments p where p.order_id = o.id order by p.created_at desc limit 1
      ) as payment_status
      from orders o
      where ${db(column)} = ${value}
    `;
    if (!rows.length) return null;
    const o = rows[0];
    const items = await db`
      select sku, product_name, color_name, size, unit_price_cop, quantity, line_total_cop
      from order_items where order_id = ${o.id} order by sku
    `;
    const summary: OrderSummary = {
      id: o.id,
      reference: o.reference,
      status: o.status as OrderStatus,
      paymentStatus: (o.payment_status as PaymentStatus | null) ?? null,
      accessTokenHash: o.access_token_hash,
      customerEmail: o.customer_email,
      customerName: o.customer_name,
      shippingAddress: o.shipping_address,
      shippingZone: o.shipping_zone,
      subtotal: o.subtotal_cop,
      discount: o.discount_cop,
      shipping: o.shipping_cop,
      total: o.total_cop,
      isDemo: o.is_demo,
      createdAt: new Date(o.created_at).toISOString(),
      items: items.map((i) => ({
        sku: i.sku,
        productName: i.product_name,
        colorName: i.color_name,
        size: Number(i.size),
        unitPrice: i.unit_price_cop,
        quantity: i.quantity,
        lineTotal: i.line_total_cop,
      })),
    };
    return summary;
  }

  async function releaseStock(tx: Tx, orderId: string) {
    const items = await tx`
      select oi.variant_id, oi.quantity from order_items oi where oi.order_id = ${orderId} order by oi.variant_id
    `;
    for (const item of items) {
      await tx`update variants set stock = stock + ${item.quantity} where id = ${item.variant_id}`;
      await tx`
        insert into inventory_movements (variant_id, delta, reason, order_id)
        values (${item.variant_id}, ${item.quantity}, 'order_released', ${orderId})
      `;
    }
  }

  return {
    async placeOrder(input) {
      const existing = await findOrder(sql, "idempotency_key", input.idempotencyKey);
      if (existing) return { ok: true, order: existing, duplicate: true };

      try {
        await sql.begin(async (tx) => {
          const skus = input.lines.map((l) => l.sku);
          // Bloqueo en orden determinista para evitar interbloqueos.
          const rows = await tx`
            select v.id, v.sku, v.stock, v.size, p.price_cop, p.name, p.status, p.is_demo, c.name as color_name
            from variants v
            join products p on p.id = v.product_id
            join product_colors c on c.id = v.color_id
            where v.sku in ${tx(skus)}
            order by v.id
            for update of v
          `;
          const bySku = new Map(rows.map((r) => [r.sku as string, r]));

          let subtotal = 0;
          for (const line of input.lines) {
            const row = bySku.get(line.sku);
            if (!row || row.status !== "published") throw new OrderRejected({ ok: false, reason: "not_found", sku: line.sku });
            if (row.stock < line.quantity) throw new OrderRejected({ ok: false, reason: "insufficient_stock", sku: line.sku });
            if (row.price_cop !== line.expectedUnitPrice) throw new OrderRejected({ ok: false, reason: "price_changed", sku: line.sku });
            subtotal += row.price_cop * line.quantity;
          }

          const discount = 0;
          const total = subtotal - discount + input.shipping.amount;
          const isDemo = input.lines.some((l) => bySku.get(l.sku)?.is_demo);
          const [order] = await tx`
            insert into orders (
              reference, idempotency_key, access_token_hash, customer_email, customer_name, customer_phone,
              shipping_address, shipping_method, shipping_zone, subtotal_cop, discount_cop, shipping_cop,
              total_cop, is_demo, expires_at
            ) values (
              ${input.reference}, ${input.idempotencyKey}, ${input.accessTokenHash}, ${input.customer.email},
              ${input.customer.name}, ${input.customer.phone}, ${tx.json(JSON.parse(JSON.stringify(input.address)))},
              ${input.shipping.methodId}, ${input.shipping.zoneLabel}, ${subtotal}, ${discount},
              ${input.shipping.amount}, ${total}, ${isDemo}, ${input.expiresAt}
            )
            returning id
          `;

          for (const line of input.lines) {
            const row = bySku.get(line.sku)!;
            await tx`update variants set stock = stock - ${line.quantity} where id = ${row.id}`;
            await tx`
              insert into inventory_movements (variant_id, delta, reason, order_id)
              values (${row.id}, ${-line.quantity}, 'order_reserved', ${order.id})
            `;
            await tx`
              insert into order_items (order_id, variant_id, sku, product_name, color_name, size, unit_price_cop, quantity, line_total_cop)
              values (${order.id}, ${row.id}, ${line.sku}, ${row.name}, ${row.color_name}, ${row.size},
                      ${row.price_cop}, ${line.quantity}, ${row.price_cop * line.quantity})
            `;
          }

          await tx`
            insert into payments (order_id, provider, provider_reference, amount_cop)
            values (${order.id}, 'wompi', ${input.reference}, ${total})
          `;
        });
      } catch (error) {
        if (error instanceof OrderRejected) return error.result;
        // Doble envío simultáneo con la misma clave: devolver el pedido ya creado.
        if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
          const order = await findOrder(sql, "idempotency_key", input.idempotencyKey);
          if (order) return { ok: true, order, duplicate: true };
        }
        throw error;
      }

      const order = await findOrder(sql, "reference", input.reference);
      if (!order) throw new Error("Pedido creado pero no encontrado");
      return { ok: true, order, duplicate: false };
    },

    getOrderByReference(reference) {
      return findOrder(sql, "reference", reference);
    },

    async processPaymentEvent(event: PaymentEvent): Promise<PaymentEventResult> {
      return sql.begin(async (tx) => {
        const inserted = await tx`
          insert into payment_events (provider, event_key, event_type, payload)
          values (${event.provider}, ${event.eventKey}, ${event.eventType}, ${tx.json(JSON.parse(JSON.stringify(event.payload ?? null)))})
          on conflict (provider, event_key) do nothing
          returning id
        `;
        if (!inserted.length) return "duplicate";
        const eventId = inserted[0].id;
        const finish = async (result: PaymentEventResult) => {
          await tx`update payment_events set result = ${result}, processed_at = now() where id = ${eventId}`;
          return result;
        };

        const [payment] = await tx`
          select p.id, p.status, p.amount_cop, p.order_id, o.status as order_status
          from payments p join orders o on o.id = p.order_id
          where p.provider = ${event.provider} and p.provider_reference = ${event.reference}
          for update of p, o
        `;
        if (!payment) return finish("unknown_reference");

        if (event.amountCop !== payment.amount_cop || event.currency !== "COP") {
          await tx`
            update orders set needs_review = true,
              review_reason = ${`Monto del proveedor (${event.amountCop} ${event.currency}) distinto al del pedido (${payment.amount_cop} COP)`}
            where id = ${payment.order_id}
          `;
          return finish("amount_mismatch");
        }

        const current = payment.status as PaymentStatus;
        if (current === event.status) return finish("stale");
        if (!canTransitionPayment(current, event.status)) {
          // Dinero recibido para un pedido ya cerrado (p. ej. vencido): nunca ignorarlo.
          if (event.status === "approved") {
            await tx`
              update orders set needs_review = true,
                review_reason = ${`Pago aprobado (${event.transactionId}) con pago local en estado ${current}`}
              where id = ${payment.order_id}
            `;
            return finish("needs_review");
          }
          return finish("stale");
        }

        await tx`
          update payments
          set status = ${event.status}, provider_transaction_id = ${event.transactionId}, status_detail = ${event.statusDetail}
          where id = ${payment.id}
        `;

        const effect = orderEffectOfPayment(payment.order_status as OrderStatus, event.status);
        if (effect) {
          if (effect.releaseStock) await releaseStock(tx, payment.order_id);
          await tx`update orders set status = ${effect.status} where id = ${payment.order_id}`;
          if (effect.status === "refunded") {
            await tx`update orders set needs_review = true, review_reason = 'Pago anulado después de aprobado' where id = ${payment.order_id}`;
          }
        }
        return finish("applied");
      });
    },

    async expireStaleOrders(now = new Date()) {
      return sql.begin(async (tx) => {
        const stale = await tx`
          select o.id from orders o
          where o.status = 'pending_payment' and o.expires_at < ${now}
            and not exists (select 1 from payments p where p.order_id = o.id and p.status = 'approved')
          order by o.id
          for update skip locked
        `;
        for (const o of stale) {
          await releaseStock(tx, o.id);
          await tx`update orders set status = 'cancelled' where id = ${o.id}`;
          await tx`update payments set status = 'voided', status_detail = 'Vencido sin pago' where order_id = ${o.id} and status = 'pending'`;
        }
        return stale.length;
      });
    },
  };
}
