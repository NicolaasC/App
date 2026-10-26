"use client";

import Image, { type ImageLoader } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

/** Las fotos de Unsplash se redimensionan en su propio CDN (imgix), como piden sus directrices. */
const unsplashLoader: ImageLoader = ({ src, width, quality }) =>
  `${src}${src.includes("?") ? "&" : "?"}w=${width}&q=${quality ?? 70}&auto=format&fit=max`;

const isUnsplash = (src: string) => src.startsWith("https://images.unsplash.com/");

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  focal?: string;
  priority?: boolean;
  className?: string;
  /** Texto del placeholder cuando no hay foto. */
  fallbackLabel?: string;
}

/**
 * Imagen responsiva (rellena su contenedor, que define la proporción).
 * Si no hay archivo o falla la carga, muestra un placeholder neutro.
 */
export function ProductImage({ src, alt, sizes, focal, priority, className, fallbackLabel }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt ? `${alt} (foto no disponible)` : "Foto no disponible"}
        className={cn("absolute inset-0 flex flex-col items-center justify-center gap-3 bg-sand-soft text-stone", className)}
      >
        <svg viewBox="0 0 64 32" className="w-1/3 max-w-24" fill="none" aria-hidden="true">
          <path
            d="M4 24c0-3 2-5 5-6l14-5c3-1 5-4 7-7 1-2 4-2 5 0 2 3 5 5 9 6l10 2c4 1 6 4 6 7v3H4v0Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M4 27h56" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span className="px-4 text-center text-[0.6875rem] uppercase tracking-[0.16em] text-muted">
          {fallbackLabel ?? "Foto pendiente"}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={70}
      loader={isUnsplash(src) ? unsplashLoader : undefined}
      priority={priority}
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
      style={focal ? { objectPosition: focal } : undefined}
    />
  );
}
