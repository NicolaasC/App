import "server-only";
import { facetOptions } from "@/lib/catalog/filters";
import type { Product } from "@/lib/catalog/types";
import type { FacetData } from "@/components/catalog/FilterPanel";
import type { CategoryWithCount } from "./queries";

export function buildFacets(products: Product[], categories: CategoryWithCount[]): FacetData {
  const { sizes, colors, priceRange } = facetOptions(products);
  return {
    categories: categories.map((c) => ({ slug: c.slug, name: c.name, count: c.productCount })),
    sizes,
    colors,
    priceRange,
  };
}
