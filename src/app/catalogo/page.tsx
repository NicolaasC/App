import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts, getVisibleCategories } from "@/server/catalog/queries";
import { buildFacets } from "@/server/catalog/facets";
import { CatalogView } from "@/components/catalog/CatalogView";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { Container, Eyebrow } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Sneakers, calzado casual, formal, botas y sandalias. Filtra por talla, color y precio.",
  alternates: { canonical: "/catalogo" },
};

export default async function CatalogPage() {
  const [products, categories] = await Promise.all([getProducts(), getVisibleCategories()]);
  const facets = buildFacets(products, categories);

  return (
    <Container className="pb-8 pt-10 md:pt-14">
      <header className="mb-10 md:mb-12">
        <Eyebrow className="mb-3">Tienda</Eyebrow>
        <h1 className="font-serif text-headline">Catálogo</h1>
      </header>
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogView products={products} facets={facets} />
      </Suspense>
    </Container>
  );
}
