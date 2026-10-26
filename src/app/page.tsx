import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import {
  getCollection,
  getFeaturedProducts,
  getNewArrivals,
  getVisibleCategories,
} from "@/server/catalog/queries";
import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { EditorialBlock } from "@/components/home/EditorialBlock";
import { Benefits } from "@/components/home/Benefits";
import { Newsletter } from "@/components/home/Newsletter";
import { ProductGrid } from "@/components/product/ProductCard";
import { Container, SectionHeading } from "@/components/ui/Container";
import { DemoNotice } from "@/components/ui/DemoNotice";

function SeeAll({ href, label = "Ver todo" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline">
      {label}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden="true" />
    </Link>
  );
}

export default async function HomePage() {
  const [categories, featured, allNew, allCollections] = await Promise.all([
    getVisibleCategories(),
    getFeaturedProducts(8),
    getNewArrivals(12),
    Promise.all(siteConfig.homeCollections.map((tag) => getCollection(tag, 12))),
  ]);

  // Evita repetir el mismo producto en varias secciones de la home.
  const shown = new Set(featured.map((p) => p.id));
  const take = <T extends { id: string }>(items: T[], limit: number) => {
    const picked = items.filter((p) => !shown.has(p.id)).slice(0, limit);
    picked.forEach((p) => shown.add(p.id));
    return picked;
  };
  const newArrivals = take(allNew, 4);
  const collections = allCollections.map((c) => ({ ...c, products: take(c.products, 4) }));

  return (
    <>
      <Hero />
      <DemoNotice />
      <CategoryGrid categories={categories} />

      {featured.length ? (
        <section aria-labelledby="destacados-title" className="pb-20 md:pb-28">
          <Container>
            <SectionHeading
              id="destacados-title"
              eyebrow="Selección"
              title="Destacados"
              action={<SeeAll href="/catalogo" />}
            />
            <ProductGrid products={featured} />
          </Container>
        </section>
      ) : null}

      <EditorialBlock />

      {newArrivals.length ? (
        <section aria-labelledby="novedades-title" className="py-20 md:py-28">
          <Container>
            <SectionHeading
              id="novedades-title"
              eyebrow="Recién llegados"
              title="Novedades"
              action={<SeeAll href="/catalogo?orden=novedades" />}
            />
            <ProductGrid products={newArrivals} />
          </Container>
        </section>
      ) : null}

      {collections
        .filter((c) => c.products.length >= 2)
        .map((c) => (
          <section key={c.tag} aria-labelledby={`coleccion-${c.tag}`} className="pb-20 md:pb-28">
            <Container>
              <SectionHeading
                id={`coleccion-${c.tag}`}
                eyebrow="Colección"
                title={c.title}
                action={<SeeAll href={`/catalogo?coleccion=${c.tag}`} />}
              />
              {c.description ? <p className="-mt-4 mb-10 max-w-md text-sm text-muted">{c.description}</p> : null}
              <ProductGrid products={c.products} />
            </Container>
          </section>
        ))}

      <Benefits />
      {siteConfig.newsletter.enabled ? <Newsletter /> : null}
    </>
  );
}
