"use client";

import { useEffect, useState } from "react";
import { quoteCartAction } from "@/app/actions/cart";
import type { CartQuote, QuoteIssue } from "@/server/pricing/quote";
import { updateCart, useCart, useCartHydrated } from "./store";

interface QuoteResult {
  key: string;
  quote: CartQuote | null;
  error: string | null;
}

/**
 * Pide al servidor la cotización del carrito cada vez que cambia y
 * sincroniza el carrito local con el resultado (cantidades ajustadas,
 * productos retirados, precios vigentes).
 */
export function useCartQuote() {
  const cart = useCart();
  const hydrated = useCartHydrated();
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [issues, setIssues] = useState<QuoteIssue[]>([]);
  const [attempt, setAttempt] = useState(0);

  const key = cart.items.map((i) => `${i.sku}:${i.quantity}`).join("|");

  useEffect(() => {
    if (!hydrated || !cart.items.length) return;
    let cancelled = false;
    const lines = cart.items.map((i) => ({
      sku: i.sku,
      quantity: i.quantity,
      expectedUnitPrice: i.snapshot.unitPrice,
    }));
    quoteCartAction(lines)
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          setResult((prev) => ({ key, quote: prev?.quote ?? null, error: res.error }));
          return;
        }
        setResult({ key, quote: res.quote, error: null });
        if (res.quote.issues.length) setIssues(res.quote.issues);
        reconcile(res.quote);
      })
      .catch(() => {
        if (!cancelled) {
          setResult((prev) => ({
            key,
            quote: prev?.quote ?? null,
            error: "Sin conexión con la tienda. Revisa tu internet e inténtalo de nuevo.",
          }));
        }
      });
    return () => {
      cancelled = true;
    };
    // `key` resume el contenido del carrito; `attempt` fuerza reintentos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, key, attempt]);

  const hasItems = cart.items.length > 0;
  const fresh = result?.key === key;

  return {
    cart,
    hydrated,
    /** Cotización vigente (solo si corresponde al carrito actual). */
    quote: hasItems && fresh ? result.quote : null,
    issues,
    dismissIssues: () => setIssues([]),
    error: hasItems && fresh ? result.error : null,
    loading: !hydrated || (hasItems && !fresh),
    retry: () => setAttempt((n) => n + 1),
  };
}

/** Aplica al carrito local las correcciones del servidor. */
export function reconcile(quote: CartQuote) {
  const bySku = new Map(quote.lines.map((l) => [l.sku, l]));
  const removed = new Set(
    quote.issues.filter((i) => i.code === "not_found" || i.code === "unavailable").map((i) => i.sku),
  );
  updateCart((state) => {
    let changed = false;
    const items = state.items.flatMap((item) => {
      if (removed.has(item.sku)) {
        changed = true;
        return [];
      }
      const line = bySku.get(item.sku);
      if (!line) return [item];
      if (line.quantity !== item.quantity || line.unitPrice !== item.snapshot.unitPrice) {
        changed = true;
        return [{ ...item, quantity: line.quantity, snapshot: { ...item.snapshot, unitPrice: line.unitPrice } }];
      }
      return [item];
    });
    return changed ? { version: 1, items } : state;
  });
}
