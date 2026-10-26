"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import type { CatalogFilters } from "@/lib/catalog/filters";
import type { CategorySlug, Gender } from "@/lib/catalog/types";
import { formatCOP } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface FacetData {
  categories: { slug: CategorySlug; name: string; count: number }[];
  sizes: number[];
  colors: { id: string; name: string; swatch: string }[];
  priceRange: { min: number; max: number };
}

const GENDERS: { value: Gender; label: string }[] = [
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
  { value: "unisex", label: "Unisex" },
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-b border-line py-6 first:pt-0">
      <legend className="mb-4 float-left w-full text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted">
        {title}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  const id = useId();
  return (
    <div className="flex items-center gap-3 py-1.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 cursor-pointer appearance-none rounded-[2px] border border-line-strong bg-paper bg-center bg-no-repeat checked:border-ink checked:bg-ink checked:bg-[url('/icons/check.svg')]"
      />
      <label htmlFor={id} className="flex flex-1 cursor-pointer items-center justify-between text-sm">
        {children}
      </label>
    </div>
  );
}

interface FilterPanelProps {
  filters: CatalogFilters;
  facets: FacetData;
  onChange: (next: CatalogFilters) => void;
  /** Si la página ya fija una categoría, el bloque de categorías navega en vez de filtrar. */
  lockedCategory?: CategorySlug;
}

export function FilterPanel({ filters, facets, onChange, lockedCategory }: FilterPanelProps) {
  const set = (patch: Partial<CatalogFilters>) => onChange({ ...filters, ...patch });

  return (
    <div>
      <Section title="Categoría">
        {lockedCategory ? (
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              <Link href="/catalogo" className="block py-1.5 text-ink/75 hover:text-ink">
                Todo el catálogo
              </Link>
            </li>
            {facets.categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/catalogo/${c.slug}`}
                  aria-current={c.slug === lockedCategory ? "page" : undefined}
                  className={cn(
                    "flex justify-between py-1.5 hover:text-ink",
                    c.slug === lockedCategory ? "font-medium text-ink" : "text-ink/75",
                  )}
                >
                  {c.name}
                  <span className="text-muted">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          facets.categories.map((c) => (
            <CheckRow
              key={c.slug}
              checked={filters.categories.includes(c.slug)}
              onChange={() => set({ categories: toggle(filters.categories, c.slug) })}
            >
              {c.name}
              <span className="text-muted">{c.count}</span>
            </CheckRow>
          ))
        )}
      </Section>

      <Section title="Para">
        {GENDERS.map((g) => (
          <CheckRow
            key={g.value}
            checked={filters.genders.includes(g.value)}
            onChange={() => set({ genders: toggle(filters.genders, g.value) })}
          >
            {g.label}
          </CheckRow>
        ))}
      </Section>

      <Section title="Talla (EU)">
        <div className="grid grid-cols-4 gap-1.5">
          {facets.sizes.map((size) => {
            const active = filters.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                aria-pressed={active}
                onClick={() => set({ sizes: toggle(filters.sizes, size) })}
                className={cn(
                  "h-10 rounded-sm border text-sm tabular-nums transition-colors",
                  active ? "border-ink bg-ink text-paper" : "border-line-strong bg-paper hover:border-ink",
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Color">
        <div className="flex flex-wrap gap-2">
          {facets.colors.map((c) => {
            const active = filters.colors.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => set({ colors: toggle(filters.colors, c.id) })}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full border pl-1.5 pr-3 text-sm transition-colors",
                  active ? "border-ink bg-paper" : "border-line-strong hover:border-ink",
                )}
              >
                <span className="size-5 rounded-full border border-ink/30" style={{ background: c.swatch }} aria-hidden="true" />
                {c.name}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Precio">
        <PriceRange
          key={`${filters.minPrice}-${filters.maxPrice}`}
          min={filters.minPrice}
          max={filters.maxPrice}
          range={facets.priceRange}
          onApply={(minPrice, maxPrice) => set({ minPrice, maxPrice })}
        />
      </Section>

      <Section title="Disponibilidad">
        <CheckRow checked={filters.inStockOnly} onChange={() => set({ inStockOnly: !filters.inStockOnly })}>
          Solo con existencias
        </CheckRow>
      </Section>
    </div>
  );
}

function PriceRange({
  min,
  max,
  range,
  onApply,
}: {
  min: number | null;
  max: number | null;
  range: { min: number; max: number };
  onApply: (min: number | null, max: number | null) => void;
}) {
  const [minValue, setMinValue] = useState(min?.toString() ?? "");
  const [maxValue, setMaxValue] = useState(max?.toString() ?? "");
  const minId = useId();
  const maxId = useId();
  const parse = (v: string) => {
    const n = Number(v.replace(/\D/g, ""));
    return v.trim() && n > 0 ? n : null;
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(parse(minValue), parse(maxValue));
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={minId} className="mb-1 block text-xs text-muted">
            Mínimo
          </label>
          <input
            id={minId}
            inputMode="numeric"
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
            placeholder={formatCOP(range.min)}
            className="h-10 w-full rounded-sm border border-line-strong bg-paper px-3 text-sm tabular-nums placeholder:text-stone"
          />
        </div>
        <div>
          <label htmlFor={maxId} className="mb-1 block text-xs text-muted">
            Máximo
          </label>
          <input
            id={maxId}
            inputMode="numeric"
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
            placeholder={formatCOP(range.max)}
            className="h-10 w-full rounded-sm border border-line-strong bg-paper px-3 text-sm tabular-nums placeholder:text-stone"
          />
        </div>
      </div>
      <button
        type="submit"
        className="h-9 rounded-sm border border-ink text-xs font-medium uppercase tracking-[0.1em] hover:bg-ink hover:text-paper"
      >
        Aplicar precio
      </button>
    </form>
  );
}
