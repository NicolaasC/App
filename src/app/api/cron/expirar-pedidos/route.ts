import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { orderRepository } from "@/server/orders";

/**
 * Cancela pedidos sin pagar cuya reserva venció y libera existencias.
 * Vercel Cron envía `Authorization: Bearer <CRON_SECRET>`.
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const repo = orderRepository();
  if (!repo) return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
  try {
    const expired = await repo.expireStaleOrders();
    return NextResponse.json({ expired });
  } catch (error) {
    console.error("cron expirar-pedidos:", error instanceof Error ? error.message : "desconocido");
    return NextResponse.json({ error: "Error temporal" }, { status: 500 });
  }
}
