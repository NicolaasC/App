import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { PaymentEvent, PaymentStatus } from "@/server/orders/types";

/**
 * Integración con Wompi (Colombia). Basada en la documentación pública
 * (docs.wompi.co) consultada en oct-2026 — verificar contra la versión vigente
 * antes de activar pagos reales. Ver docs/pagos.md.
 *
 *  - Firma de integridad del checkout: SHA-256(referencia + monto_en_centavos + moneda [+ expiración] + secreto_integridad)
 *  - Eventos: SHA-256(valores de signature.properties + timestamp + secreto_eventos),
 *    comparado con signature.checksum (o la cabecera X-Event-Checksum).
 */

export const WOMPI_CHECKOUT_URL = "https://checkout.wompi.co/p/";

export function toCents(cop: number): number {
  if (!Number.isInteger(cop) || cop < 0) throw new RangeError("Monto COP inválido");
  return cop * 100;
}

const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

export function integritySignature(params: {
  reference: string;
  amountInCents: number;
  currency: "COP";
  integritySecret: string;
  expirationTime?: string;
}): string {
  if (!params.integritySecret) throw new Error("Falta el secreto de integridad de Wompi");
  return sha256(
    `${params.reference}${params.amountInCents}${params.currency}${params.expirationTime ?? ""}${params.integritySecret}`,
  );
}

/** URL del Web Checkout de Wompi (redirección). */
export function buildCheckoutUrl(params: {
  publicKey: string;
  reference: string;
  amountInCents: number;
  integritySignature: string;
  redirectUrl: string;
  customerEmail?: string;
}): string {
  const url = new URL(WOMPI_CHECKOUT_URL);
  url.searchParams.set("public-key", params.publicKey);
  url.searchParams.set("currency", "COP");
  url.searchParams.set("amount-in-cents", String(params.amountInCents));
  url.searchParams.set("reference", params.reference);
  url.searchParams.set("signature:integrity", params.integritySignature);
  url.searchParams.set("redirect-url", params.redirectUrl);
  if (params.customerEmail) url.searchParams.set("customer-data:email", params.customerEmail);
  return url.toString();
}

const eventSchema = z.object({
  event: z.string(),
  data: z.object({
    transaction: z.object({
      id: z.string(),
      status: z.string(),
      amount_in_cents: z.number().int().nonnegative(),
      reference: z.string(),
      currency: z.string(),
      status_message: z.string().nullish(),
    }),
  }),
  environment: z.string().optional(),
  signature: z.object({
    properties: z.array(z.string()).min(1),
    checksum: z.string().regex(/^[a-fA-F0-9]{64}$/),
  }),
  timestamp: z.number().int(),
});

export type WompiEvent = z.infer<typeof eventSchema>;

function readPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) return (acc as Record<string, unknown>)[key];
    return undefined;
  }, source);
}

export function computeEventChecksum(event: WompiEvent, eventsSecret: string): string {
  const values = event.signature.properties.map((p) => {
    const v = readPath(event.data, p);
    if (v === undefined || v === null || typeof v === "object") {
      throw new Error(`Propiedad firmada ausente: ${p}`);
    }
    return String(v);
  });
  return sha256(`${values.join("")}${event.timestamp}${eventsSecret}`);
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a.toLowerCase(), "hex");
  const bb = Buffer.from(b.toLowerCase(), "hex");
  return ba.length === bb.length && ba.length > 0 && timingSafeEqual(ba, bb);
}

export type VerifyResult =
  | { ok: true; event: WompiEvent }
  | { ok: false; reason: "missing_secret" | "invalid_payload" | "invalid_signature" | "stale_timestamp" };

/**
 * Verifica un evento recibido. Si llega la cabecera X-Event-Checksum también
 * debe coincidir. `maxAgeSeconds` limita repeticiones de eventos antiguos.
 */
export function verifyWompiEvent(
  body: unknown,
  eventsSecret: string | undefined,
  options: { headerChecksum?: string | null; now?: number; maxAgeSeconds?: number } = {},
): VerifyResult {
  // Un secreto vacío produciría un hash "válido" para cualquiera: rechazar.
  if (!eventsSecret) return { ok: false, reason: "missing_secret" };
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return { ok: false, reason: "invalid_payload" };
  const event = parsed.data;

  let expected: string;
  try {
    expected = computeEventChecksum(event, eventsSecret);
  } catch {
    return { ok: false, reason: "invalid_payload" };
  }
  if (!safeEqualHex(expected, event.signature.checksum)) return { ok: false, reason: "invalid_signature" };
  if (options.headerChecksum && !safeEqualHex(expected, options.headerChecksum)) {
    return { ok: false, reason: "invalid_signature" };
  }
  if (options.maxAgeSeconds !== undefined) {
    const now = options.now ?? Math.floor(Date.now() / 1000);
    if (Math.abs(now - event.timestamp) > options.maxAgeSeconds) return { ok: false, reason: "stale_timestamp" };
  }
  return { ok: true, event };
}

const STATUS_MAP: Record<string, PaymentStatus> = {
  PENDING: "pending",
  APPROVED: "approved",
  DECLINED: "declined",
  VOIDED: "voided",
  ERROR: "error",
};

export function mapWompiStatus(status: string): PaymentStatus | null {
  return STATUS_MAP[status.toUpperCase()] ?? null;
}

/** Convierte un evento verificado al formato interno. null si no es un evento de transacción conocido. */
export function toPaymentEvent(event: WompiEvent): PaymentEvent | null {
  if (event.event !== "transaction.updated") return null;
  const tx = event.data.transaction;
  const status = mapWompiStatus(tx.status);
  if (!status) return null;
  return {
    provider: "wompi",
    // El checksum es único por contenido firmado + timestamp: sirve como clave de idempotencia.
    eventKey: `${tx.id}:${tx.status}:${event.signature.checksum.toLowerCase()}`,
    eventType: event.event,
    reference: tx.reference,
    transactionId: tx.id,
    status,
    amountCop: tx.amount_in_cents / 100,
    currency: tx.currency,
    statusDetail: tx.status_message ?? null,
    // Solo se guarda lo necesario: sin datos personales del comprador.
    payload: {
      event: event.event,
      environment: event.environment,
      timestamp: event.timestamp,
      transaction: { id: tx.id, status: tx.status, amount_in_cents: tx.amount_in_cents, reference: tx.reference, currency: tx.currency },
    },
  };
}
