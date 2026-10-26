"use client";

import { Check } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/catalog/types";
import {
  availabilityOf,
  defaultColorId,
  imagesForColor,
  maxOrderable,
  sizeOptions,
  sizesFor,
} from "@/lib/catalog/variants";
import { addItem } from "@/lib/cart/cart";
import { updateCart, useCart } from "@/lib/cart/store";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Price } from "./Price";
import { ProductGallery } from "./ProductGallery";
import { QuantitySelector } from "./QuantitySelector";
import { SizeGuide } from "./SizeGuide";

interface ProductViewProps {
  product: Product;
  categoryName: string;
  /** Secciones informativas renderizadas en el servidor. */
  details: ReactNode;
}

export function ProductView({ product, categoryName, details }: ProductViewProps) {
  const toast = useToast();
  const cart = useCart();
  const [colorId, setColorId] = useState(() => defaultColorId(product));
  const [size, setSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  const options = useMemo(() => sizeOptions(product, colorId), [product, colorId]);
  const images = useMemo(() => imagesForColor(product, colorId), [product, colorId]);
  const selected = options.find((o) => o.size === size) ?? null;
  const inCart = selected ? (cart.items.find((i) => i.sku === selected.sku)?.quantity ?? 0) : 0;
  const maxQty = selected ? maxOrderable(selected.stock, inCart) : 1;
  const colorSoldOut = options.every((o) => o.stock <= 0);

  const chooseColor = (id: string) => {
    setColorId(id);
    // Conserva la talla si existe con existencias en el nuevo color.
    const next = sizeOptions(product, id).find((o) => o.size === size);
    if (!next || next.stock <= 0) setSize(null);
    setQuantity(1);
  };

  const chooseSize = (value: number) => {
    setSize(value);
    setSizeError(false);
    setQuantity(1);
  };

  const add = () => {
    if (!selected) {
      setSizeError(true);
      return;
    }
    let result: ReturnType<typeof addItem> | undefined;
    updateCart((state) => {
      result = addItem(
        state,
        {
          sku: selected.sku,
          snapshot: {
            productSlug: product.slug,
            name: product.name,
            colorName: color.name,
            size: selected.size,
            unitPrice: product.price,
            imageId: images[0]?.id ?? null,
          },
        },
        quantity,
        selected.stock,
      );
      return result.state;
    });
    if (!result || result.added === 0) {
      toast({ tone: "error", message: "Ya tienes en el carrito todas las unidades disponibles de esta talla." });
      return;
    }
    toast({
      tone: "success",
      message: result.limited
        ? `Agregamos ${result.added} ${result.added === 1 ? "unidad" : "unidades"} (máximo disponible).`
        : `${product.name} · talla ${selected.size} agregado al carrito.`,
      action: { label: "Ver carrito", href: "/carrito" },
    });
    setQuantity(1);
  };

  const availability = selected ? availabilityOf(selected.stock) : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
      <ProductGallery images={images} productName={product.name} colorName={color.name} />

      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted">{categoryName}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-[2.5rem] leading-[1.05] md:text-5xl">{product.name}</h1>
          {product.isNew ? <Badge tone="sage">Nuevo</Badge> : null}
        </div>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} className="mt-4 text-lg" />
        {product.isDemo ? <p className="mt-1 text-xs text-muted">Precio de demostración</p> : null}
        <p className="mt-6 text-[0.9375rem] leading-relaxed text-ink/80 text-pretty">{product.description}</p>

        {/* Color */}
        <fieldset className="mt-8">
          <legend className="mb-3 text-sm">
            Color: <span className="font-medium">{color.name}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((c) => {
              const soldOut = !product.variants.some((v) => v.colorId === c.id && v.stock > 0);
              return (
                <label
                  key={c.id}
                  className={cn(
                    "relative flex size-11 cursor-pointer items-center justify-center rounded-full border transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
                    c.id === colorId ? "border-ink" : "border-transparent hover:border-line-strong",
                  )}
                  title={soldOut ? `${c.name} (agotado)` : c.name}
                >
                  <input
                    type="radio"
                    name="color"
                    value={c.id}
                    checked={c.id === colorId}
                    onChange={() => chooseColor(c.id)}
                    className="sr-only"
                    aria-label={soldOut ? `${c.name}, agotado` : c.name}
                  />
                  <span className="size-8 rounded-full border border-ink/15" style={{ background: c.swatch }} aria-hidden="true" />
                  {soldOut ? (
                    <span className="absolute h-px w-9 rotate-45 bg-ink/60" aria-hidden="true" />
                  ) : null}
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Talla */}
        <fieldset className="mt-8" aria-describedby={sizeError ? "talla-error" : undefined}>
          <div className="mb-3 flex items-center justify-between">
            <legend className="text-sm">
              Talla (EU){selected ? <span className="font-medium">: {selected.size}</span> : null}
            </legend>
            <SizeGuide sizes={sizesFor(product)} />
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {options.map((o) => {
              const out = o.stock <= 0;
              const active = o.size === size;
              return (
                <label
                  key={o.sku}
                  className={cn(
                    "relative flex h-12 items-center justify-center rounded-sm border text-sm tabular-nums transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
                    out
                      ? "cursor-not-allowed border-line bg-transparent text-stone line-through"
                      : active
                        ? "cursor-pointer border-ink bg-ink text-paper"
                        : "cursor-pointer border-line-strong bg-paper hover:border-ink",
                  )}
                >
                  <input
                    type="radio"
                    name="talla"
                    value={o.size}
                    checked={active}
                    disabled={out}
                    onChange={() => chooseSize(o.size)}
                    className="sr-only"
                    aria-label={out ? `Talla ${o.size}, agotada` : `Talla ${o.size}`}
                  />
                  {o.size}
                </label>
              );
            })}
          </div>
          {sizeError ? (
            <p id="talla-error" role="alert" className="mt-2 text-xs font-medium text-danger">
              Selecciona una talla para continuar.
            </p>
          ) : null}
        </fieldset>

        {/* Disponibilidad */}
        <div className="mt-5 min-h-5 text-sm" aria-live="polite">
          {colorSoldOut ? (
            <p className="text-danger">Este color está agotado.</p>
          ) : availability === "out_of_stock" ? (
            <p className="text-danger">Talla agotada.</p>
          ) : availability === "low_stock" ? (
            <p className="text-ink">
              Últimas {selected!.stock} {selected!.stock === 1 ? "unidad" : "unidades"} en esta talla.
            </p>
          ) : availability === "in_stock" ? (
            <p className="flex items-center gap-1.5 text-success">
              <Check className="size-4" aria-hidden="true" /> Disponible
            </p>
          ) : null}
          {inCart > 0 ? <p className="mt-1 text-xs text-muted">Ya tienes {inCart} en el carrito.</p> : null}
        </div>

        {/* Cantidad + agregar */}
        <div className="mt-5 flex gap-3">
          <QuantitySelector
            value={quantity}
            max={Math.max(1, maxQty)}
            onChange={(v) => setQuantity(Math.max(1, Math.min(v, Math.max(1, maxQty))))}
            disabled={!selected || maxQty <= 0}
          />
          <Button
            size="lg"
            className="flex-1"
            onClick={add}
            disabled={colorSoldOut || (selected !== null && maxQty <= 0)}
          >
            {colorSoldOut ? "Agotado" : selected && maxQty <= 0 ? "Máximo en el carrito" : "Agregar al carrito"}
          </Button>
        </div>

        <div className="mt-10">{details}</div>
      </div>
    </div>
  );
}
