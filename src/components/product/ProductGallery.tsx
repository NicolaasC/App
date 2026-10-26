"use client";

import { useState } from "react";
import type { CatalogImage } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { ProductImage } from "@/components/ui/ProductImage";

interface ProductGalleryProps {
  images: CatalogImage[];
  productName: string;
  colorName: string;
}

export function ProductGallery({ images, productName, colorName }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [lastImages, setLastImages] = useState(images);
  if (images !== lastImages) {
    setLastImages(images);
    setSelected(0);
  }
  const current = images[selected];

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse md:gap-4">
      <div className="relative aspect-[4/5] flex-1 overflow-hidden bg-tone-soft">
        <ProductImage
          key={current?.id ?? "vacía"}
          src={current?.src}
          alt={current?.alt ?? `${productName} en color ${colorName}`}
          focal={current?.focal}
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          fallbackLabel={current ? "Foto pendiente" : `Foto pendiente para el color ${colorName}`}
          className="animate-fade-in"
        />
        {current?.provisional ? (
          <p className="absolute bottom-3 left-3 rounded-sm bg-paper/90 px-2 py-1 text-[0.625rem] uppercase tracking-[0.12em] text-muted">
            Foto de referencia
          </p>
        ) : null}
      </div>
      {images.length > 1 ? (
        <ul className="flex gap-2 md:w-20 md:flex-col" aria-label="Miniaturas">
          {images.map((img, i) => (
            <li key={img.id} className="w-20 md:w-full">
              <button
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`Ver imagen ${i + 1} de ${images.length}`}
                aria-current={i === selected || undefined}
                className={cn(
                  "relative block aspect-[4/5] w-full overflow-hidden bg-tone-soft outline-offset-2 transition-opacity",
                  i === selected ? "ring-1 ring-ink" : "opacity-70 hover:opacity-100",
                )}
              >
                <ProductImage src={img.src} alt="" focal={img.focal} sizes="80px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
