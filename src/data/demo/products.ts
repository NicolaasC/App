/**
 * Catálogo de DEMOSTRACIÓN. Nombres, precios, existencias y materiales son
 * ficticios y sirven solo para evaluar la experiencia. No publicar como reales.
 */
import type { Material, Product, ProductColor, Variant } from "@/lib/catalog/types";
import { demoImage, type DemoPhotoId } from "./images";

const COLORS = {
  gris: { id: "gris", name: "Gris", swatch: "#9a9a96" },
  blanco: { id: "blanco", name: "Blanco", swatch: "#f7f6f2" },
  negro: { id: "negro", name: "Negro", swatch: "#262622" },
  cafe: { id: "cafe", name: "Café", swatch: "#7a5235" },
  miel: { id: "miel", name: "Miel", swatch: "#b07a43" },
  arena: { id: "arena", name: "Arena", swatch: "#d8c7a8" },
  salvia: { id: "salvia", name: "Salvia", swatch: "#a9b09e" },
  azul: { id: "azul", name: "Azul", swatch: "#2f4a6d" },
  multicolor: {
    id: "multicolor",
    name: "Multicolor",
    swatch: "conic-gradient(#c8553d, #f2c14e, #5b8e7d, #2f4a6d, #c8553d)",
  },
} satisfies Record<string, ProductColor>;

type ColorKey = keyof typeof COLORS;

const SIZES = {
  mujer: [35, 36, 37, 38, 39, 40],
  hombre: [38, 39, 40, 41, 42, 43, 44],
  unisex: [36, 37, 38, 39, 40, 41, 42, 43],
} as const;

/** Existencias deterministas y variadas (algunas agotadas o con pocas unidades). */
function demoStock(seed: string): number {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const bucket = hash % 10;
  if (bucket === 0) return 0;
  if (bucket <= 2) return 1 + (hash % 2);
  return 3 + (hash % 9);
}

interface Spec {
  code: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: Product["category"];
  gender: Product["gender"];
  price: number;
  compareAtPrice?: number;
  /** El primer color tiene foto; los demás muestran "foto pendiente". */
  colors: ColorKey[];
  photo: DemoPhotoId;
  materials: string[];
  collections?: string[];
  featured?: boolean;
  isNew?: boolean;
  publishedAt: string;
  rank: number;
  soldOut?: boolean;
}

function build(spec: Spec): Product {
  const colors = spec.colors.map((key) => COLORS[key]);
  const sizes = SIZES[spec.gender];
  const variants: Variant[] = colors.flatMap((color) =>
    sizes.map((size) => {
      const sku = `${spec.code}-${color.id.slice(0, 3).toUpperCase()}-${size}`;
      return { sku, colorId: color.id, size, stock: spec.soldOut ? 0 : demoStock(sku) };
    }),
  );
  const materials: Material[] = spec.materials.map((label) => ({ label, verified: false }));

  return {
    id: spec.code,
    slug: spec.slug,
    name: spec.name,
    shortDescription: spec.shortDescription,
    description: spec.description,
    category: spec.category,
    gender: spec.gender,
    price: spec.price,
    compareAtPrice: spec.compareAtPrice,
    colors,
    variants,
    materials,
    images: [demoImage(spec.photo, { colorId: colors[0].id })],
    collections: spec.collections ?? [],
    featured: spec.featured ?? false,
    isNew: spec.isNew ?? false,
    publishedAt: spec.publishedAt,
    status: "published",
    rank: spec.rank,
    isDemo: true,
  };
}

const specs: Spec[] = [
  // ── Sneakers ──────────────────────────────────────────────
  {
    code: "SNK01",
    slug: "tenis-trazo-gris",
    name: "Tenis Trazo",
    shortDescription: "Caña baja, línea limpia.",
    description:
      "Tenis de caña baja con silueta sobria para uso diario. Descripción de demostración: los detalles técnicos se completarán con la ficha del proveedor.",
    category: "sneakers",
    gender: "unisex",
    price: 329900,
    colors: ["gris", "blanco"],
    photo: "sneaker-gris-minimal",
    materials: ["Exterior textil (por confirmar)", "Suela de caucho (por confirmar)"],
    collections: ["esenciales"],
    featured: true,
    isNew: true,
    publishedAt: "2026-10-01",
    rank: 95,
  },
  {
    code: "SNK02",
    slug: "tenis-ciudad-blanco",
    name: "Tenis Ciudad",
    shortDescription: "El blanco que combina con todo.",
    description:
      "Tenis blanco de caña baja pensado para la ciudad. Producto de demostración con información provisional.",
    category: "sneakers",
    gender: "unisex",
    price: 289900,
    colors: ["blanco"],
    photo: "sneaker-blanco-urbano",
    materials: ["Exterior sintético (por confirmar)"],
    collections: ["esenciales"],
    featured: true,
    publishedAt: "2026-08-14",
    rank: 90,
  },
  {
    code: "SNK03",
    slug: "tenis-estudio-caja",
    name: "Tenis Estudio",
    shortDescription: "Perfil deportivo para todos los días.",
    description:
      "Tenis de inspiración deportiva con perfil cómodo. Información de demostración pendiente de verificación.",
    category: "sneakers",
    gender: "hombre",
    price: 349900,
    colors: ["negro", "gris"],
    photo: "sneaker-sobre-caja",
    materials: ["Exterior por confirmar"],
    collections: ["fin-de-semana"],
    isNew: true,
    publishedAt: "2026-10-12",
    rank: 70,
  },
  {
    code: "SNK04",
    slug: "tenis-contraste-blanco-naranja",
    name: "Tenis Contraste",
    shortDescription: "Blanco con acentos naranja.",
    description:
      "Tenis deportivo blanco con detalles en naranja. Producto de demostración sin ficha técnica verificada.",
    category: "sneakers",
    gender: "mujer",
    price: 309900,
    colors: ["blanco"],
    photo: "sneaker-blanco-naranja",
    materials: ["Exterior por confirmar"],
    collections: ["fin-de-semana"],
    featured: true,
    publishedAt: "2026-07-03",
    rank: 75,
  },
  {
    code: "SNK05",
    slug: "tenis-nocturno-dorado-azul",
    name: "Tenis Nocturno",
    shortDescription: "Dorado y azul para destacar.",
    description:
      "Tenis de colores intensos para quienes buscan un acento. Producto de demostración.",
    category: "sneakers",
    gender: "unisex",
    price: 389900,
    colors: ["azul"],
    photo: "sneaker-dorado-azul",
    materials: ["Exterior por confirmar"],
    publishedAt: "2026-05-20",
    rank: 40,
    soldOut: true,
  },
  // ── Casual ────────────────────────────────────────────────
  {
    code: "CAS01",
    slug: "mocasin-paseo",
    name: "Mocasín Paseo",
    shortDescription: "Sin cordones, listo para salir.",
    description:
      "Mocasín ligero para el día a día. Producto de demostración: la foto muestra varios modelos de referencia.",
    category: "casual",
    gender: "mujer",
    price: 219900,
    colors: ["miel", "negro"],
    photo: "casual-mocasines-color",
    materials: ["Exterior por confirmar"],
    collections: ["esenciales"],
    featured: true,
    publishedAt: "2026-09-02",
    rank: 85,
  },
  {
    code: "CAS02",
    slug: "nautico-puerto-cafe",
    name: "Náutico Puerto",
    shortDescription: "Clásico relajado en tono café.",
    description: "Zapato náutico de estilo relajado. Información de demostración.",
    category: "casual",
    gender: "hombre",
    price: 259900,
    colors: ["cafe"],
    photo: "casual-nautico-cafe",
    materials: ["Exterior por confirmar"],
    collections: ["fin-de-semana"],
    publishedAt: "2026-06-18",
    rank: 60,
  },
  {
    code: "CAS03",
    slug: "zapato-cordon-cafe",
    name: "Zapato Cordón",
    shortDescription: "Caña baja con carácter.",
    description:
      "Zapato casual de cordones con aspecto usado en la foto de referencia. Producto de demostración.",
    category: "casual",
    gender: "unisex",
    price: 239900,
    colors: ["cafe"],
    photo: "casual-cordon-cafe",
    materials: ["Exterior por confirmar"],
    publishedAt: "2026-04-11",
    rank: 45,
  },
  {
    code: "CAS04",
    slug: "zapato-banco-blanco",
    name: "Zapato Banco",
    shortDescription: "Blanco y versátil.",
    description: "Zapato casual blanco para combinar con facilidad. Producto de demostración.",
    category: "casual",
    gender: "mujer",
    price: 199900,
    colors: ["blanco", "arena"],
    photo: "casual-blanco-banco",
    materials: ["Exterior por confirmar"],
    collections: ["esenciales"],
    isNew: true,
    publishedAt: "2026-10-20",
    rank: 65,
  },
  // ── Formal ────────────────────────────────────────────────
  {
    code: "FOR01",
    slug: "oxford-brogue-cafe",
    name: "Oxford Brogue",
    shortDescription: "Puntera perforada, acabado clásico.",
    description:
      "Zapato formal de cordones con puntera tipo brogue. Datos de demostración, sin ficha técnica verificada.",
    category: "formal",
    gender: "hombre",
    price: 429900,
    colors: ["cafe"],
    photo: "formal-brogue-cafe",
    materials: ["Cuero (por confirmar)"],
    collections: ["oficina"],
    featured: true,
    publishedAt: "2026-08-28",
    rank: 88,
  },
  {
    code: "FOR02",
    slug: "derby-clasico-cafe",
    name: "Derby Clásico",
    shortDescription: "Para la oficina y más allá.",
    description: "Zapato de vestir en tono café. Producto de demostración.",
    category: "formal",
    gender: "hombre",
    price: 389900,
    colors: ["cafe", "negro"],
    photo: "formal-cuero-cafe",
    materials: ["Cuero (por confirmar)"],
    collections: ["oficina"],
    publishedAt: "2026-03-09",
    rank: 72,
  },
  {
    code: "FOR03",
    slug: "zapato-bicolor",
    name: "Zapato Bicolor",
    shortDescription: "Contraste café y negro.",
    description: "Zapato de vestir con combinación de tonos. Producto de demostración.",
    category: "formal",
    gender: "hombre",
    price: 459900,
    colors: ["cafe"],
    photo: "formal-bicolor",
    materials: ["Material por confirmar"],
    publishedAt: "2026-02-15",
    rank: 50,
  },
  {
    code: "FOR04",
    slug: "tacon-punta-cafe",
    name: "Tacón Punta",
    shortDescription: "Punta fina, tono café.",
    description: "Zapato de tacón de punta fina para ocasiones especiales. Producto de demostración.",
    category: "formal",
    gender: "mujer",
    price: 349900,
    colors: ["cafe", "negro"],
    photo: "formal-tacon-punta",
    materials: ["Material por confirmar"],
    collections: ["oficina"],
    featured: true,
    isNew: true,
    publishedAt: "2026-10-08",
    rank: 80,
  },
  // ── Botas ─────────────────────────────────────────────────
  {
    code: "BOT01",
    slug: "bota-andina-cafe",
    name: "Bota Andina",
    shortDescription: "Cordones y caña media.",
    description:
      "Bota de cordones pensada para clima frío y lluvia. Datos de demostración: impermeabilidad no verificada.",
    category: "botas",
    gender: "unisex",
    price: 489900,
    colors: ["cafe"],
    photo: "bota-cordon-cafe",
    materials: ["Cuero (por confirmar)"],
    collections: ["fin-de-semana"],
    featured: true,
    publishedAt: "2026-09-15",
    rank: 92,
  },
  {
    code: "BOT02",
    slug: "botin-chukka",
    name: "Botín Chukka",
    shortDescription: "Dos ojales, estilo atemporal.",
    description: "Botín tipo chukka de caña baja. Producto de demostración.",
    category: "botas",
    gender: "unisex",
    price: 419900,
    colors: ["miel", "cafe"],
    photo: "bota-chukka",
    materials: ["Material por confirmar"],
    collections: ["esenciales"],
    publishedAt: "2026-07-22",
    rank: 68,
  },
  {
    code: "BOT03",
    slug: "bota-taller",
    name: "Bota Taller",
    shortDescription: "Robusta y de cordones.",
    description: "Bota de cordones de aspecto robusto. Producto de demostración.",
    category: "botas",
    gender: "hombre",
    price: 529900,
    colors: ["cafe"],
    photo: "bota-piso-madera",
    materials: ["Material por confirmar"],
    publishedAt: "2026-01-30",
    rank: 55,
  },
  {
    code: "BOT04",
    slug: "botin-negro",
    name: "Botín Negro",
    shortDescription: "Negro esencial para la ciudad.",
    description: "Botín negro de líneas simples. Producto de demostración.",
    category: "botas",
    gender: "mujer",
    price: 399900,
    colors: ["negro"],
    photo: "bota-negra",
    materials: ["Material por confirmar"],
    collections: ["oficina"],
    isNew: true,
    publishedAt: "2026-10-18",
    rank: 78,
  },
  {
    code: "BOT05",
    slug: "bota-combate-bicolor",
    name: "Bota Combate",
    shortDescription: "Blanco y negro, caña alta.",
    description: "Bota de inspiración militar en dos tonos. Producto de demostración.",
    category: "botas",
    gender: "unisex",
    price: 459900,
    colors: ["negro"],
    photo: "bota-combate-bicolor",
    materials: ["Material por confirmar"],
    publishedAt: "2026-05-05",
    rank: 42,
  },
  {
    code: "BOT06",
    slug: "bota-tacon-negra",
    name: "Bota Tacón",
    shortDescription: "Caña alta y tacón.",
    description: "Bota negra de tacón para looks de noche. Producto de demostración.",
    category: "botas",
    gender: "mujer",
    price: 479900,
    colors: ["negro"],
    photo: "bota-tacon-negra",
    materials: ["Material por confirmar"],
    publishedAt: "2026-06-01",
    rank: 58,
  },
  // ── Sandalias ─────────────────────────────────────────────
  {
    code: "SAN01",
    slug: "sandalia-prado",
    name: "Sandalia Prado",
    shortDescription: "Tiras anchas y planta plana.",
    description: "Sandalia de tiras para clima cálido. Producto de demostración.",
    category: "sandalias",
    gender: "unisex",
    price: 179900,
    colors: ["negro", "cafe"],
    photo: "sandalia-cuero-pasto",
    materials: ["Material por confirmar"],
    collections: ["fin-de-semana"],
    featured: true,
    publishedAt: "2026-09-25",
    rank: 82,
  },
  {
    code: "SAN02",
    slug: "sandalia-costa",
    name: "Sandalia Costa",
    shortDescription: "Tres tonos para viajar.",
    description: "Sandalia plana en tres tonos. Producto de demostración.",
    category: "sandalias",
    gender: "mujer",
    price: 159900,
    colors: ["arena"],
    photo: "sandalia-plana-tricolor",
    materials: ["Material por confirmar"],
    publishedAt: "2026-04-28",
    rank: 52,
  },
  {
    code: "SAN03",
    slug: "sandalia-color",
    name: "Sandalia Color",
    shortDescription: "Plana y llena de color.",
    description: "Sandalia plana multicolor. Producto de demostración.",
    category: "sandalias",
    gender: "mujer",
    price: 149900,
    colors: ["multicolor"],
    photo: "sandalia-multicolor",
    materials: ["Material por confirmar"],
    isNew: true,
    publishedAt: "2026-10-22",
    rank: 48,
  },
  // ── Otros estilos ─────────────────────────────────────────
  {
    code: "OTR01",
    slug: "zapato-etiqueta-negro",
    name: "Zapato Etiqueta",
    shortDescription: "Negro, versátil, entre lo casual y lo formal.",
    description: "Modelo negro versátil. Producto de demostración.",
    category: "otros",
    gender: "unisex",
    price: 269900,
    colors: ["negro", "salvia"],
    photo: "otros-negro-etiqueta",
    materials: ["Material por confirmar"],
    publishedAt: "2026-03-30",
    rank: 44,
  },
];

export const demoProducts: Product[] = specs.map(build);
