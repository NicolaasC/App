import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CategoryWithCount } from "@/server/catalog/queries";
import { Container, SectionHeading } from "@/components/ui/Container";
import { ProductImage } from "@/components/ui/ProductImage";

export function CategoryGrid({ categories }: { categories: CategoryWithCount[] }) {
  if (!categories.length) return null;
  return (
    <section aria-labelledby="categorias-title" className="py-20 md:py-28">
      <Container>
        <SectionHeading id="categorias-title" eyebrow="Categorías" title="Encuentra tu estilo" />
        <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => {
            const image = c.coverProduct?.images[0];
            return (
              <li key={c.slug} className="w-[62vw] shrink-0 snap-start sm:w-auto">
                <Link href={`/catalogo/${c.slug}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-tone-soft">
                    <ProductImage
                      src={image?.src}
                      alt=""
                      focal={image?.focal}
                      sizes="(min-width: 1024px) 15vw, (min-width: 640px) 30vw, 62vw"
                      className="transition-transform duration-700 ease-(--ease-soft) group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
                      fallbackLabel={c.name}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-serif text-xl">{c.name}</span>
                    <ArrowUpRight
                      className="size-4 text-stone transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-xs text-muted">
                    {c.productCount} {c.productCount === 1 ? "modelo" : "modelos"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
