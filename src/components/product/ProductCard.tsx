import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { productAvailability } from "@/lib/catalog/variants";
import { Badge } from "@/components/ui/Badge";
import { ProductImage } from "@/components/ui/ProductImage";
import { Price } from "./Price";

const CARD_SIZES = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const image = product.images[0];
  const soldOut = productAvailability(product) === "out_of_stock";

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-sand-soft">
        <ProductImage
          src={image?.src}
          alt={image?.alt ?? product.name}
          focal={image?.focal}
          sizes={CARD_SIZES}
          priority={priority}
          className="transition-transform duration-700 ease-(--ease-soft) group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {soldOut ? <Badge tone="neutral">Agotado</Badge> : product.isNew ? <Badge tone="sage">Nuevo</Badge> : null}
        </div>
      </div>
      <div className="mt-3.5 flex flex-col gap-1 sm:mt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h3 className="text-[0.9375rem] font-medium leading-snug">
            <Link href={`/producto/${product.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ink">
              {product.name}
            </Link>
          </h3>
          <p className="mt-0.5 hidden truncate text-sm text-muted sm:block">{product.shortDescription}</p>
        </div>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} className="shrink-0 text-sm sm:text-[0.9375rem]" />
      </div>
      {product.colors.length > 1 ? (
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="sr-only">Colores disponibles:</span>
          {product.colors.map((c) => (
            <span
              key={c.id}
              title={c.name}
              className="size-3 rounded-full border border-ink/15"
              style={{ background: c.swatch }}
            >
              <span className="sr-only">{c.name}</span>
            </span>
          ))}
          <span className="ml-1 text-xs text-muted" aria-hidden="true">
            {product.colors.length} colores
          </span>
        </div>
      ) : null}
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4 xl:gap-y-14">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
