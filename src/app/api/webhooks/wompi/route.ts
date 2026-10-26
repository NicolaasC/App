import { NextResponse } from "next/server";
import { getSql } from "@/server/db";
import { serverEnv } from "@/server/env";
import { createPostgresOrderRepository } from "@/server/orders/postgres-repository";
import { toPaymentEvent, verifyWompiEvent } from "@/server/payments/wompi";

/**
 * Webhook de eventos de Wompi.
 *  - 401 si la firma no es válida (no se procesa nada).
 *  - 200 para eventos duplicados o ignorados (Wompi deja de reintentar).
 *  - 5xx ante errores temporales, para que Wompi reintente.
 */
export async function POST(request: Request) {
  const env = serverEnv();
  if (env.PAYMENTS_PROVIDER !== "wompi" || !env.WOMPI_EVENTS_SECRET) {
    return NextResponse.json({ error: "Pagos no configurados" }, { status: 503 });
  }

  const raw = await request.text();
  if (raw.length > 64_000) return NextResponse.json({ error: "Carga demasiado grande" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const verified = verifyWompiEvent(body, env.WOMPI_EVENTS_SECRET, {
    headerChecksum: request.headers.get("x-event-checksum"),
  });
  if (!verified.ok) {
    console.warn("wompi webhook rechazado:", verified.reason);
    return NextResponse.json({ error: "Firma inválida" }, { status: verified.reason === "invalid_payload" ? 400 : 401 });
  }

  const event = toPaymentEvent(verified.event);
  if (!event) return NextResponse.json({ received: true, ignored: true });

  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });

  try {
    const result = await createPostgresOrderRepository(sql).processPaymentEvent(event);
    if (result !== "applied" && result !== "duplicate") {
      console.warn("wompi webhook:", result, event.reference);
    }
    return NextResponse.json({ received: true, result });
  } catch (error) {
    console.error("wompi webhook error:", error instanceof Error ? error.message : "desconocido");
    return NextResponse.json({ error: "Error temporal" }, { status: 500 });
  }
}
