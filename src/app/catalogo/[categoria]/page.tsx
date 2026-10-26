import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { CategorySlug } from "@/lib/catalog/types";
import { getCategory, getProducts, getVisibleCategories } from "@/server/catalog/queries";
import { buildFacets } from "@/server/catalog/facets";
import { CatalogView } from "@/components/catalog/CatalogView";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { Container, Eyebrow } from "@/components/ui/Container";
import Link from "next/link";

export async function generateStaticParams() {
  const categories = await getVisibleCategories();
  return categories.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/catalogo/[categoria]">): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getCategory(categoria);
  if (!category) return { title: "Categoría no encontrada" };
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/catalogo/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps<"/catalogo/[categoria]">) {
  const { categoria } = await params;
  const category = await getCategory(categoria);
  if (!category) notFound();

  const [allProducts, categories] = await Promise.all([getProducts(), getVisibleCategories()]);
  const products = allProducts.filter((p) => p.category === category.slug);
  const facets = { ...buildFacets(products, categories) };

  return (
    <Container className="pb-8 pt-10 md:pt-14">
      <nav aria-label="Ruta de navegación" className="mb-6 text-xs text-muted">
        <ol className="flex gap-2">
          <li>
            <Link href="/catalogo" className="hover:text-ink">
              Catálogo
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {category.name}
          </li>
        </ol>
      </nav>
      <header className="mb-10 md:mb-12">
        <Eyebrow className="mb-3">Categoría</Eyebrow>
        <h1 className="font-serif text-headline">{category.name}</h1>
        <p className="mt-3 max-w-lg text-sm text-muted">{category.description}</p>
      </header>
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogView products={products} facets={facets} lockedCategory={category.slug as CategorySlug} />
      </Suspense>
    </Container>
  );
}
