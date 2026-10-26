import type { CatalogRepository } from "@/server/catalog/repository";
import type { CartLineInput } from "@/lib/validation/checkout";
import { MAX_QUANTITY_PER_LINE } from "@/lib/catalog/variants";
import type { ShippingQuote } from "@/server/shipping/quote-shipping";

/**
 * Cotización autoritativa del carrito. Usa exclusivamente precios y
 * existencias del repositorio; lo que envía el navegador solo indica SKU y
 * cantidad deseada.
 *
 * Reglas:
 *  - SKU inexistente o producto despublicado → línea eliminada (issue "not_found").
 *  - Variante sin existencias → línea eliminada (issue "unavailable").
 *  - Cantidad mayor que existencias → se ajusta (issue "insufficient_stock").
 *  - Precio distinto al que vio el cliente → se usa el del servidor (issue "price_changed").
 */
export type QuoteIssueCode = "not_found" | "unavailable" | "insufficient_stock" | "price_changed";

export interface QuoteIssue {
  sku: string;
  code: QuoteIssueCode;
  message: string;
}

export interface QuoteLine {
  sku: string;
  productId: string;
  productSlug: string;
  name: string;
  colorName: string;
  size: number;
  image: { src: string | null; alt: string; focal?: string } | null;
  unitPrice: number;
  quantity: number;
  requestedQuantity: number;
  stock: number;
  lineTotal: number;
  isDemo: boolean;
}

export interface CartQuote {
  currency: "COP";
  lines: QuoteLine[];
  issues: QuoteIssue[];
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  shipping: ShippingQuote | null;
  total: number;
  containsDemoProducts: boolean;
}

export async function quoteCart(
  catalog: CatalogRepository,
  input: CartLineInput[],
  /** Calcula el envío a partir del subtotal (p. ej. reglas de envío gratis). */
  resolveShipping: (subtotal: number) => ShippingQuote | null = () => null,
): Promise<CartQuote> {
  // Agrupa SKUs repetidos (el navegador podría enviarlos duplicados).
  const merged = new Map<string, CartLineInput>();
  for (const line of input) {
    const prev = merged.get(line.sku);
    merged.set(line.sku, {
      sku: line.sku,
      quantity: Math.min((prev?.quantity ?? 0) + line.quantity, MAX_QUANTITY_PER_LINE),
      expectedUnitPrice: line.expectedUnitPrice ?? prev?.expectedUnitPrice,
    });
  }

  const found = await catalog.findVariants([...merged.keys()]);
  const lines: QuoteLine[] = [];
  const issues: QuoteIssue[] = [];

  for (const line of merged.values()) {
    const match = found.get(line.sku);
    if (!match) {
      issues.push({ sku: line.sku, code: "not_found", message: "Este producto ya no está disponible y se retiró del carrito." });
      continue;
    }
    const { product, variant } = match;
    const color = product.colors.find((c) => c.id === variant.colorId);
    const label = `${product.name} (${color?.name ?? variant.colorId}, talla ${variant.size})`;

    if (variant.stock <= 0) {
      issues.push({ sku: line.sku, code: "unavailable", message: `${label} se agotó y se retiró del carrito.` });
      continue;
    }
    const quantity = Math.min(line.quantity, variant.stock, MAX_QUANTITY_PER_LINE);
    if (quantity < line.quantity) {
      issues.push({
        sku: line.sku,
        code: "insufficient_stock",
        message: `Solo hay ${variant.stock} ${variant.stock === 1 ? "unidad" : "unidades"} de ${label}. Ajustamos la cantidad.`,
      });
    }
    if (line.expectedUnitPrice !== undefined && line.expectedUnitPrice !== product.price) {
      issues.push({ sku: line.sku, code: "price_changed", message: `El precio de ${label} cambió. Mostramos el precio vigente.` });
    }
    const image = product.images.find((img) => img.colorId === variant.colorId) ?? product.images[0] ?? null;
    lines.push({
      sku: variant.sku,
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      colorName: color?.name ?? variant.colorId,
      size: variant.size,
      image: image ? { src: image.src, alt: image.alt, focal: image.focal } : null,
      unitPrice: product.price,
      quantity,
      requestedQuantity: line.quantity,
      stock: variant.stock,
      lineTotal: product.price * quantity,
      isDemo: product.isDemo,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  // No hay motor de descuentos: solo se aplicarán promociones reales configuradas.
  const discountTotal = 0;
  const shipping = lines.length ? resolveShipping(subtotal - discountTotal) : null;
  const shippingAmount = shipping?.amount ?? 0;

  return {
    currency: "COP",
    lines,
    issues,
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    subtotal,
    discountTotal,
    shipping,
    total: subtotal - discountTotal + shippingAmount,
    containsDemoProducts: lines.some((l) => l.isDemo),
  };
}
