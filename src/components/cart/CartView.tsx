"use client";

import { AlertTriangle, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { removeItem, setQuantity } from "@/lib/cart/cart";
import { updateCart } from "@/lib/cart/store";
import { useCartQuote } from "@/lib/cart/use-cart-quote";
import { maxOrderable } from "@/lib/catalog/variants";
import { formatCOP, pluralize } from "@/lib/format";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductImage } from "@/components/ui/ProductImage";
import { Spinner } from "@/components/ui/Spinner";
import { QuantitySelector } from "@/components/product/QuantitySelector";

export function CartView() {
  const { cart, hydrated, quote, issues, dismissIssues, error, loading, retry } = useCartQuote();

  if (!hydrated) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Cargando carrito" />
      </div>
    );
  }

  if (!cart.items.length) {
    return (
      <>
        {issues.length ? <IssueList issues={issues} onDismiss={dismissIssues} /> : null}
        <EmptyState
          icon={<ShoppingBag className="size-8" strokeWidth={1.2} />}
          title="Tu carrito está vacío"
          description="Explora el catálogo y agrega el calzado que te guste."
          action={<ButtonLink href="/catalogo">Explorar catálogo</ButtonLink>}
        />
      </>
    );
  }

  const linesBySku = new Map(quote?.lines.map((l) => [l.sku, l]) ?? []);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
      <div>
        {issues.length ? <IssueList issues={issues} onDismiss={dismissIssues} /> : null}
        {error ? (
          <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-sm border border-danger/40 bg-paper p-4 text-sm">
            <p>{error}</p>
            <Button size="sm" variant="secondary" onClick={retry}>
              Reintentar
            </Button>
          </div>
        ) : null}
        <ul className="divide-y divide-line border-y border-line">
          {cart.items.map((item) => {
            const line = linesBySku.get(item.sku);
            const unitPrice = line?.unitPrice ?? item.snapshot.unitPrice;
            const max = line ? maxOrderable(line.stock) : item.quantity;
            return (
              <li key={item.sku} className="flex gap-4 py-6 sm:gap-6">
                <Link
                  href={`/producto/${item.snapshot.productSlug}`}
                  className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-tone-soft sm:w-28"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <ProductImage src={line?.image?.src} alt="" focal={line?.image?.focal} sizes="112px" fallbackLabel=" " />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[0.9375rem] font-medium">
                        <Link href={`/producto/${item.snapshot.productSlug}`} className="hover:underline hover:underline-offset-4">
                          {line?.name ?? item.snapshot.name}
                        </Link>
                      </h2>
                      <p className="mt-1 text-sm text-muted">
                        {line?.colorName ?? item.snapshot.colorName} · Talla {line?.size ?? item.snapshot.size}
                      </p>
                      <p className="mt-1 text-sm tabular-nums text-muted">{formatCOP(unitPrice)} c/u</p>
                    </div>
                    <p className="text-[0.9375rem] tabular-nums">{formatCOP(unitPrice * item.quantity)}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <QuantitySelector
                      size="sm"
                      value={item.quantity}
                      max={Math.max(1, max)}
                      label={`Cantidad de ${item.snapshot.name}`}
                      onChange={(q) => updateCart((s) => setQuantity(s, item.sku, Math.min(q, Math.max(1, max))))}
                    />
                    <button
                      type="button"
                      onClick={() => updateCart((s) => removeItem(s, item.sku))}
                      className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
                    >
                      <Trash2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
                      Eliminar
                    </button>
                  </div>
                  {line && line.stock <= 2 ? (
                    <p className="mt-2 text-xs text-muted">
                      Quedan {pluralize(line.stock, "unidad", "unidades")} en esta talla.
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        <Link href="/catalogo" className="mt-6 inline-block text-sm underline underline-offset-4">
          Seguir comprando
        </Link>
      </div>

      <aside aria-labelledby="resumen-title" className="h-fit bg-paper p-6 lg:sticky lg:top-24 sm:p-8">
        <h2 id="resumen-title" className="font-serif text-3xl">
          Resumen
        </h2>
        <dl className="mt-6 space-y-3 text-sm" aria-busy={loading}>
          <div className="flex justify-between">
            <dt>Subtotal ({pluralize(quote?.itemCount ?? cart.items.reduce((s, i) => s + i.quantity, 0), "artículo", "artículos")})</dt>
            <dd className="tabular-nums">{quote ? formatCOP(quote.subtotal) : <Spinner className="size-4" />}</dd>
          </div>
          {quote && quote.discountTotal > 0 ? (
            <div className="flex justify-between">
              <dt>Descuentos</dt>
              <dd className="tabular-nums">−{formatCOP(quote.discountTotal)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between text-muted">
            <dt>Envío</dt>
            <dd>Se calcula en el checkout</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-4 text-base font-medium">
            <dt>Total estimado</dt>
            <dd className="tabular-nums">{quote ? formatCOP(quote.total) : "—"}</dd>
          </div>
        </dl>
        <ButtonLink
          href="/checkout"
          size="lg"
          className="mt-8 w-full"
          aria-disabled={!quote || loading || undefined}
        >
          Continuar al checkout
        </ButtonLink>
        <p className="mt-4 text-xs text-muted">
          Precios y existencias verificados por la tienda. El total final se confirma al pagar.
          {quote?.containsDemoProducts ? " Productos de demostración: no se realizarán cobros." : ""}
        </p>
      </aside>
    </div>
  );
}

function IssueList({ issues, onDismiss }: { issues: { sku: string; message: string; code: string }[]; onDismiss: () => void }) {
  return (
    <div role="status" className="mb-6 rounded-sm border border-line-strong bg-tone-soft p-4 text-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <div className="flex-1">
          <p className="font-medium">Actualizamos tu carrito</p>
          <ul className="mt-1 space-y-1 text-ink/80">
            {issues.map((i) => (
              <li key={`${i.sku}-${i.code}`}>{i.message}</li>
            ))}
          </ul>
        </div>
        <button type="button" onClick={onDismiss} className="text-xs underline underline-offset-4">
          Entendido
        </button>
      </div>
    </div>
  );
}
