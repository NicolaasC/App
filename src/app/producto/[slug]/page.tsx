import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { shippingConfig } from "@/config/shipping";
import { formatCOP } from "@/lib/format";
import { productAvailability } from "@/lib/catalog/variants";
import { getCategory, getProduct, getProducts, getRelatedProducts } from "@/server/catalog/queries";
import { ProductView } from "@/components/product/ProductView";
import { ProductGrid } from "@/components/product/ProductCard";
import { Container, SectionHeading } from "@/components/ui/Container";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Producto no encontrado" };
  const image = product.images[0]?.src;
  return {
    title: product.name,
    description: `${product.shortDescription} ${formatCOP(product.price)}.`,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: image ? [{ url: image, alt: product.images[0].alt }] : undefined,
    },
  };
}

function Detail({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-t border-line last:border-b">
      <summary className="flex h-14 cursor-pointer list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <Plus className="size-4 transition-transform duration-200 group-open:rotate-45" strokeWidth={1.5} aria-hidden="true" />
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-ink/80">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [category, related] = await Promise.all([getCategory(product.category), getRelatedProducts(product, 4)]);
  const zones = shippingConfig.methods.flatMap((m) => m.zones);
  const credits = product.images.map((img) => img.credit);

  const details = (
    <div>
      <Detail title="Materiales" open>
        <ul className="list-disc space-y-1 pl-5">
          {product.materials.map((m) => (
            <li key={m.label}>{m.label}</li>
          ))}
        </ul>
        {product.materials.some((m) => !m.verified) ? (
          <p className="mt-3 text-xs text-muted">
            Información provisional: los materiales se confirmarán con la ficha técnica del proveedor.
          </p>
        ) : null}
      </Detail>
      <Detail title="Envíos">
        {shippingConfig.mode === "disabled" ? (
          <p>Los envíos aún no están habilitados.</p>
        ) : (
          <>
            <ul className="space-y-1">
              {zones.map((z) => (
                <li key={z.id} className="flex justify-between gap-4">
                  <span>{z.label}</span>
                  <span className="tabular-nums">{formatCOP(z.rate)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              {shippingConfig.mode === "demo"
                ? "Tarifas de demostración. Transportadora y tiempos de entrega por confirmar."
                : "El costo final se calcula en el checkout según tu dirección."}
            </p>
          </>
        )}
      </Detail>
      <Detail title="Cambios y devoluciones">
        <p>
          La política de cambios está pendiente de definición. Consulta{" "}
          <Link href="/cambios-y-devoluciones" className="underline underline-offset-4">
            cambios y devoluciones
          </Link>{" "}
          y tus derechos como consumidor (derecho de retracto y reversión del pago, Ley 1480 de 2011).
        </p>
      </Detail>
      <Detail title="Sobre las fotos">
        <p>Fotografía de stock usada como referencia; no muestra el producto exacto.</p>
        <ul className="mt-2 space-y-1 text-xs text-muted">
          {credits.map((c) => (
            <li key={c.sourceUrl}>
              {c.author ? `Foto: ${c.author}` : "Autoría por confirmar"} ·{" "}
              <a href={c.sourceUrl} className="underline underline-offset-2" rel="noopener noreferrer" target="_blank">
                Unsplash
              </a>{" "}
              · {c.license}
            </li>
          ))}
        </ul>
      </Detail>
    </div>
  );

  // Datos estructurados solo cuando el sitio es indexable y el producto es real.
  const jsonLd =
    siteConfig.indexable && !product.isDemo
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          sku: product.id,
          image: product.images.map((i) => i.src).filter(Boolean),
          offers: {
            "@type": "Offer",
            priceCurrency: "COP",
            price: product.price,
            availability:
              productAvailability(product) === "out_of_stock"
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            url: `${siteConfig.url}/producto/${product.slug}`,
          },
        }
      : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      ) : null}
      <Container className="pt-6 md:pt-10">
        <nav aria-label="Ruta de navegación" className="mb-6 text-xs text-muted">
          <ol className="flex flex-wrap gap-2">
            <li>
              <Link href="/catalogo" className="hover:text-ink">
                Catálogo
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            {category ? (
              <>
                <li>
                  <Link href={`/catalogo/${category.slug}`} className="hover:text-ink">
                    {category.name}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
              </>
            ) : null}
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>
        <ProductView product={product} categoryName={category?.name ?? ""} details={details} />
      </Container>

      {related.length ? (
        <section aria-labelledby="relacionados-title" className="pt-24">
          <Container>
            <SectionHeading id="relacionados-title" eyebrow="También te puede gustar" title="Productos relacionados" />
            <ProductGrid products={related} />
          </Container>
        </section>
      ) : null}
    </>
  );
}
