import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Referencia legible y no secuencial: PED-XXXXXXXXXX. */
export function generateOrderReference(): string {
  const bytes = randomBytes(10);
  let out = "";
  for (const b of bytes) out += REFERENCE_ALPHABET[b % REFERENCE_ALPHABET.length];
  return `PED-${out}`;
}

/**
 * Token de acceso a la página del pedido. Se deriva con HMAC para poder
 * reconstruirlo en un reintento idempotente; en la base de datos solo se
 * guarda su hash. `secret` = ORDER_TOKEN_SECRET (≥ 32 caracteres).
 */
export function deriveAccessToken(secret: string, reference: string, idempotencyKey: string): string {
  if (!secret || secret.length < 32) throw new Error("ORDER_TOKEN_SECRET debe tener al menos 32 caracteres");
  return createHmac("sha256", secret).update(`${reference}:${idempotencyKey}`).digest("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Compara un token recibido con el hash guardado en tiempo constante. */
export function verifyAccessToken(token: string | null | undefined, storedHash: string): boolean {
  if (!token || token.length > 100 || !/^[a-f0-9]{64}$/.test(storedHash)) return false;
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
