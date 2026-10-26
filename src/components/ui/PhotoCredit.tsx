import type { ImageCredit } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";

const UNSPLASH_REF = "https://unsplash.com/?utm_source=tienda_calzado_demo&utm_medium=referral";

/** Atribución "Foto de Autor en Unsplash", como piden las directrices de Unsplash. */
export function PhotoCredit({ credit, className }: { credit: ImageCredit; className?: string }) {
  return (
    <p className={cn("text-[0.6875rem] text-muted", className)}>
      Foto de{" "}
      {credit.authorUrl ? (
        <a href={credit.authorUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
          {credit.author ?? "autor por confirmar"}
        </a>
      ) : (
        (credit.author ?? "autor por confirmar")
      )}{" "}
      en{" "}
      <a href={UNSPLASH_REF} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
        Unsplash
      </a>
    </p>
  );
}
