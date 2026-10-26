import type { ShippingConfig, ShippingMethod, ShippingZone } from "@/config/shipping";

export interface ShippingQuote {
  methodId: string;
  label: string;
  zoneLabel: string;
  amount: number;
  estimatedTime: string | null;
  isDemo: boolean;
  freeShippingApplied: boolean;
}

export type ShippingQuoteResult =
  | { ok: true; quote: ShippingQuote }
  | { ok: false; reason: "disabled" | "unknown_method" | "no_coverage" };

function zoneFor(method: ShippingMethod, department: string): ShippingZone | undefined {
  return (
    method.zones.find((z) => Array.isArray(z.departments) && z.departments.includes(department)) ??
    method.zones.find((z) => z.departments === "*")
  );
}

/** Calcula el envío en el servidor a partir de la configuración logística. */
export function quoteShipping(
  config: ShippingConfig,
  methodId: string,
  department: string,
  subtotal: number,
): ShippingQuoteResult {
  if (config.mode === "disabled") return { ok: false, reason: "disabled" };
  const method = config.methods.find((m) => m.id === methodId);
  if (!method) return { ok: false, reason: "unknown_method" };
  const zone = zoneFor(method, department);
  if (!zone) return { ok: false, reason: "no_coverage" };
  const free = config.freeShippingThreshold !== null && subtotal >= config.freeShippingThreshold;
  return {
    ok: true,
    quote: {
      methodId: method.id,
      label: method.label,
      zoneLabel: zone.label,
      amount: free ? 0 : zone.rate,
      estimatedTime: zone.estimatedTime,
      isDemo: config.mode === "demo",
      freeShippingApplied: free,
    },
  };
}
