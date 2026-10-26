import "server-only";
import { headers } from "next/headers";

/**
 * Límite de frecuencia en memoria (ventana fija). Protección básica: en
 * Vercel cada instancia tiene su propia memoria, así que en producción debe
 * reemplazarse por un almacén compartido (p. ej. tabla en Postgres o Redis).
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export async function clientKey(scope: string): Promise<string> {
  const h = await headers();
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida";
  return `${scope}:${ip}`;
}
