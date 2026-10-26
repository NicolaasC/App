import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

/** Aviso visible de que el catálogo es de demostración. */
export function DemoNotice({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-3 border-y border-line bg-paper text-xs text-muted",
        compact ? "rounded-sm border px-4 py-3" : "px-4 py-3 sm:justify-center sm:px-6",
        className,
      )}
    >
      <Info className="mt-px size-4 shrink-0 text-stone" strokeWidth={1.5} aria-hidden="true" />
      <p>
        <strong className="font-medium text-ink">Tienda en desarrollo.</strong> Productos, precios y existencias
        son de demostración. Las fotos son de stock con licencia Unsplash y no corresponden a productos reales.
      </p>
    </div>
  );
}
