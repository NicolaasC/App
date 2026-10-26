import "server-only";
import { getSql } from "@/server/db";
import { createPostgresOrderRepository } from "./postgres-repository";
import type { OrderRepository } from "./types";

/** Repositorio de pedidos, o null si no hay base de datos configurada. */
export function orderRepository(): OrderRepository | null {
  const sql = getSql();
  return sql ? createPostgresOrderRepository(sql) : null;
}
