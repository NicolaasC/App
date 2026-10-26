/** Tipos de dominio del catálogo. Compartidos por cliente y servidor (sin secretos). */

export type CategorySlug = "sneakers" | "casual" | "formal" | "botas" | "sandalias" | "otros";

export type Gender = "mujer" | "hombre" | "unisex";

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  /** Orden de presentación en navegación y home. */
  position: number;
  /** Mostrar aunque no tenga productos (decisión editorial explícita). */
  showWhenEmpty?: boolean;
}

export interface ImageCredit {
  /** null = autoría no confirmada todavía; consultar sourceUrl. */
  author: string | null;
  /** Página de origen de la foto (p. ej. unsplash.com/photos/...). */
  sourceUrl: string;
  license: "Unsplash License";
}

export interface CatalogImage {
  id: string;
  /** Ruta servida desde /public, o null si el archivo aún no se ha descargado. */
  src: string | null;
  alt: string;
  /** Proporciones reales si se conocen (tras descargar el archivo). */
  width?: number;
  height?: number;
  /** object-position CSS para encuadrar el calzado en recortes. */
  focal?: string;
  /** Color al que corresponde la foto; undefined = todas. */
  colorId?: string;
  credit: ImageCredit;
  /** Siempre true para fotos de stock: no son fotos del producto real. */
  provisional: boolean;
}

export interface ProductColor {
  id: string;
  name: string;
  /** Color para la muestra visual del selector. */
  swatch: string;
}

export interface Variant {
  sku: string;
  colorId: string;
  /** Talla en numeración europea (la más usada en tiendas colombianas). */
  size: number;
  stock: number;
}

export interface Material {
  label: string;
  /** false = descripción provisional sin ficha técnica del proveedor. */
  verified: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: CategorySlug;
  gender: Gender;
  /** Precio en pesos colombianos (entero, sin centavos). */
  price: number;
  /** Precio anterior; solo si hubo una rebaja real y documentada. */
  compareAtPrice?: number;
  colors: ProductColor[];
  variants: Variant[];
  materials: Material[];
  images: CatalogImage[];
  /** Etiquetas de colección (p. ej. "esenciales"). */
  collections: string[];
  featured: boolean;
  isNew: boolean;
  /** Fecha ISO de publicación, usada para ordenar por novedades. */
  publishedAt: string;
  status: "published" | "draft";
  /** Puntuación editorial para ordenar por relevancia (mayor = primero). */
  rank: number;
  /** true = producto ficticio de demostración. */
  isDemo: boolean;
}

export type Availability = "in_stock" | "low_stock" | "out_of_stock";
