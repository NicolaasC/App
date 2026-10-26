/** Estado de carga del catálogo (forma similar al contenido final para evitar saltos). */
export function CatalogSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12" aria-busy="true" aria-label="Cargando catálogo">
      <div className="hidden space-y-4 lg:block">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-5 w-3/4 animate-pulse rounded-sm bg-sand-soft" />
        ))}
      </div>
      <div>
        <div className="h-11 w-full animate-pulse rounded-sm bg-sand-soft sm:w-72" />
        <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i}>
              <div className="aspect-[4/5] animate-pulse bg-sand-soft" />
              <div className="mt-4 h-4 w-2/3 animate-pulse rounded-sm bg-sand-soft" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded-sm bg-sand-soft" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
