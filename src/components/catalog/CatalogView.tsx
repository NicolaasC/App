"use client";

import { SlidersHorizontal, X, SearchX } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  applyFilters,
  countActiveFilters,
  EMPTY_FILTERS,
  parseFilters,
  serializeFilters,
  SORT_OPTIONS,
  type CatalogFilters,
  type SortValue,
} from "@/lib/catalog/filters";
import type { CategorySlug, Product } from "@/lib/catalog/types";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ProductGrid } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { FilterPanel, type FacetData } from "./FilterPanel";

interface CatalogViewProps {
  products: Product[];
  facets: FacetData;
  lockedCategory?: CategorySlug;
}

export function CatalogView({ products, facets, lockedCategory }: CatalogViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filters = useMemo(() => {
    const parsed = parseFilters(new URLSearchParams(searchParams.toString()));
    return lockedCategory ? { ...parsed, categories: [lockedCategory] } : parsed;
  }, [searchParams, lockedCategory]);

  const results = useMemo(() => applyFilters(products, filters), [products, filters]);
  const activeCount = countActiveFilters(filters) - (lockedCategory ? 1 : 0);

  const navigate = (next: CatalogFilters, mode: "push" | "replace" = "push") => {
    const params = serializeFilters(lockedCategory ? { ...next, categories: [] } : next);
    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    startTransition(() => {
      if (mode === "push") router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    });
  };

  const clearAll = () => navigate({ ...EMPTY_FILTERS, sort: filters.sort });

  // Búsqueda por texto con espera breve para no llenar el historial.
  const [query, setQuery] = useState(filters.q);
  const [lastQ, setLastQ] = useState(filters.q);
  if (filters.q !== lastQ) {
    setLastQ(filters.q);
    setQuery(filters.q);
  }
  useEffect(() => {
    if (query === filters.q) return;
    const t = window.setTimeout(() => navigate({ ...filters, q: query }, "replace"), 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const chips = activeChips(filters, facets, lockedCategory);

  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
      <aside className="hidden lg:block" aria-label="Filtros">
        <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2">
          <FilterPanel filters={filters} facets={facets} onChange={navigate} lockedCategory={lockedCategory} />
          {activeCount > 0 ? (
            <Button variant="link" className="mt-6 text-sm" onClick={clearAll}>
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      </aside>

      <div>
        <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <label htmlFor="catalogo-busqueda" className="sr-only">
              Buscar por nombre
            </label>
            <input
              id="catalogo-busqueda"
              type="search"
              value={query}
              maxLength={80}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre"
              className="h-11 w-full rounded-sm border border-line-strong bg-paper px-3.5 text-sm placeholder:text-stone"
            />
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-sm border border-line-strong bg-paper px-4 text-sm lg:hidden"
              aria-haspopup="dialog"
            >
              <SlidersHorizontal className="size-4" strokeWidth={1.5} aria-hidden="true" />
              Filtrar{activeCount > 0 ? ` (${activeCount})` : ""}
            </button>
            <div className="flex items-center gap-2">
              <label htmlFor="catalogo-orden" className="text-sm text-muted">
                Ordenar
              </label>
              <select
                id="catalogo-orden"
                value={filters.sort}
                onChange={(e) => navigate({ ...filters, sort: e.target.value as SortValue }, "replace")}
                className="h-11 appearance-none rounded-sm border border-line-strong bg-paper bg-[url('/icons/chevron.svg')] bg-[length:11px] bg-[right_12px_center] bg-no-repeat pl-3 pr-9 text-sm"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex min-h-14 flex-wrap items-center gap-2 py-4">
          <p className="mr-2 flex items-center gap-2 text-sm text-muted" aria-live="polite">
            {pluralize(results.length, "producto", "productos")}
            {isPending ? <Spinner className="size-3.5" label="Actualizando resultados" /> : null}
          </p>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => navigate(chip.remove(filters))}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong bg-paper pl-3 pr-2 text-xs hover:border-ink"
            >
              {chip.label}
              <X className="size-3.5" aria-hidden="true" />
              <span className="sr-only">Quitar filtro</span>
            </button>
          ))}
          {chips.length > 1 ? (
            <button type="button" onClick={clearAll} className="text-xs underline underline-offset-4">
              Limpiar todo
            </button>
          ) : null}
        </div>

        <div className={cn("transition-opacity duration-200", isPending && "opacity-60")}>
          {results.length ? (
            <ProductGrid products={results} priorityCount={4} />
          ) : (
            <EmptyState
              icon={<SearchX className="size-8" strokeWidth={1.2} />}
              title="No encontramos productos"
              description="Prueba con otra talla, color o rango de precios, o limpia los filtros para ver todo el catálogo."
              action={
                <Button variant="secondary" onClick={clearAll}>
                  Limpiar filtros
                </Button>
              }
            />
          )}
        </div>
      </div>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="Filtros"
        side="right"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={clearAll} disabled={activeCount === 0}>
              Limpiar
            </Button>
            <Button className="flex-1" onClick={() => setMobileOpen(false)}>
              Ver {results.length}
            </Button>
          </div>
        }
      >
        <div className="px-5 py-6">
          <FilterPanel filters={filters} facets={facets} onChange={navigate} lockedCategory={lockedCategory} />
        </div>
      </Drawer>
    </div>
  );
}

interface Chip {
  key: string;
  label: string;
  remove: (f: CatalogFilters) => CatalogFilters;
}

function activeChips(filters: CatalogFilters, facets: FacetData, lockedCategory?: CategorySlug): Chip[] {
  const chips: Chip[] = [];
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”`, remove: (f) => ({ ...f, q: "" }) });
  if (!lockedCategory) {
    for (const slug of filters.categories) {
      const name = facets.categories.find((c) => c.slug === slug)?.name ?? slug;
      chips.push({ key: `c-${slug}`, label: name, remove: (f) => ({ ...f, categories: f.categories.filter((c) => c !== slug) }) });
    }
  }
  for (const g of filters.genders) {
    chips.push({ key: `g-${g}`, label: g[0].toUpperCase() + g.slice(1), remove: (f) => ({ ...f, genders: f.genders.filter((x) => x !== g) }) });
  }
  for (const s of filters.sizes) {
    chips.push({ key: `s-${s}`, label: `Talla ${s}`, remove: (f) => ({ ...f, sizes: f.sizes.filter((x) => x !== s) }) });
  }
  for (const id of filters.colors) {
    const name = facets.colors.find((c) => c.id === id)?.name ?? id;
    chips.push({ key: `col-${id}`, label: name, remove: (f) => ({ ...f, colors: f.colors.filter((x) => x !== id) }) });
  }
  if (filters.minPrice !== null || filters.maxPrice !== null) {
    const fmt = (n: number) => `$${(n / 1000).toLocaleString("es-CO")} mil`;
    const label =
      filters.minPrice !== null && filters.maxPrice !== null
        ? `${fmt(filters.minPrice)} – ${fmt(filters.maxPrice)}`
        : filters.minPrice !== null
          ? `Desde ${fmt(filters.minPrice)}`
          : `Hasta ${fmt(filters.maxPrice!)}`;
    chips.push({ key: "price", label, remove: (f) => ({ ...f, minPrice: null, maxPrice: null }) });
  }
  if (filters.inStockOnly) chips.push({ key: "stock", label: "Con existencias", remove: (f) => ({ ...f, inStockOnly: false }) });
  if (filters.collection) chips.push({ key: "col", label: `Colección: ${filters.collection}`, remove: (f) => ({ ...f, collection: null }) });
  return chips;
}
