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
  vino: { id: "vino", name: "Vino", swatch: "#6b2232" },
  naranja: { id: "naranja", name: "Naranja", swatch: "#d9772f" },
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
    slug: "tenis-trazo-negro",
    name: "Tenis Trazo",
    shortDescription: "Negro con suela blanca.",
    description:
      "Tenis de caña baja en negro con suela blanca, para uso diario. Descripción de demostración: los detalles técnicos se completarán con la ficha del proveedor.",
    category: "sneakers",
    gender: "unisex",
    price: 329900,
    colors: ["negro", "blanco"],
    photo: "sneaker-negro-suela-blanca",
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
    description: "Tenis blanco pensado para caminar la ciudad. Producto de demostración con información provisional.",
    category: "sneakers",
    gender: "unisex",
    price: 289900,
    colors: ["blanco"],
    photo: "sneaker-blanco-calle",
    materials: ["Exterior por confirmar"],
    collections: ["esenciales"],
    featured: true,
    publishedAt: "2026-08-14",
    rank: 90,
  },
  {
    code: "SNK03",
    slug: "tenis-estudio-negro",
    name: "Tenis Estudio",
    shortDescription: "Negro, caña baja, sin complicaciones.",
    description: "Tenis negro de caña baja para todos los días. Información de demostración pendiente de verificación.",
    category: "sneakers",
    gender: "hombre",
    price: 349900,
    colors: ["negro"],
    photo: "sneaker-negro-cana-baja",
    materials: ["Exterior por confirmar"],
    collections: ["fin-de-semana"],
    isNew: true,
    publishedAt: "2026-10-12",
    rank: 70,
  },
  {
    code: "SNK04",
    slug: "tenis-contraste-cafe",
    name: "Tenis Contraste",
    shortDescription: "Café y blanco.",
    description: "Tenis en tonos café y blanco. Producto de demostración sin ficha técnica verificada.",
    category: "sneakers",
    gender: "mujer",
    price: 309900,
    colors: ["arena"],
    photo: "sneaker-cafe-blanco",
    materials: ["Exterior por confirmar"],
    collections: ["fin-de-semana"],
    featured: true,
    publishedAt: "2026-07-03",
    rank: 75,
  },
  {
    code: "SNK05",
    slug: "tenis-nocturno-bicolor",
    name: "Tenis Nocturno",
    shortDescription: "Blanco y negro, perfil clásico.",
    description: "Tenis bicolor de perfil clásico. Producto de demostración.",
    category: "sneakers",
    gender: "unisex",
    price: 389900,
    colors: ["negro"],
    photo: "sneaker-bicolor-sabana",
    materials: ["Exterior por confirmar"],
    publishedAt: "2026-05-20",
    rank: 40,
    soldOut: true,
  },
  // ── Casual ────────────────────────────────────────────────
  {
    code: "CAS01",
    slug: "mocasin-paseo-gamuza",
    name: "Mocasín Paseo",
    shortDescription: "Gamuza café con herraje.",
    description: "Mocasín de gamuza en tono café con herraje metálico. Producto de demostración.",
    category: "casual",
    gender: "mujer",
    price: 219900,
    colors: ["miel"],
    photo: "mocasin-gamuza-cafe",
    materials: ["Gamuza (por confirmar)"],
    collections: ["esenciales"],
    featured: true,
    publishedAt: "2026-09-02",
    rank: 85,
  },
  {
    code: "CAS02",
    slug: "mocasin-puerto-cafe",
    name: "Mocasín Puerto",
    shortDescription: "Cuero café, sin cordones.",
    description: "Mocasín de cuero café de estilo relajado. Información de demostración.",
    category: "casual",
    gender: "hombre",
    price: 259900,
    colors: ["cafe"],
    photo: "mocasin-cuero-cafe",
    materials: ["Cuero (por confirmar)"],
    collections: ["fin-de-semana"],
    publishedAt: "2026-06-18",
    rank: 60,
  },
  {
    code: "CAS03",
    slug: "zapato-cordon-cafe",
    name: "Zapato Cordón",
    shortDescription: "Cuero café de uso diario.",
    description: "Zapato casual de cuero café. Producto de demostración.",
    category: "casual",
    gender: "unisex",
    price: 239900,
    colors: ["cafe", "negro"],
    photo: "zapato-cuero-cafe",
    materials: ["Cuero (por confirmar)"],
    publishedAt: "2026-04-11",
    rank: 45,
  },
  {
    code: "CAS04",
    slug: "mocasin-noir",
    name: "Mocasín Noir",
    shortDescription: "Negro y versátil.",
    description: "Mocasín negro para combinar con facilidad. Producto de demostración.",
    category: "casual",
    gender: "mujer",
    price: 199900,
    colors: ["negro"],
    photo: "mocasin-negro-fondo-blanco",
    materials: ["Material por confirmar"],
    collections: ["esenciales", "oficina"],
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
    photo: "brogue-cafe-beige",
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
    description: "Zapato de vestir de cordones en cuero café. Producto de demostración.",
    category: "formal",
    gender: "hombre",
    price: 389900,
    colors: ["cafe"],
    photo: "derby-cuero-cafe",
    materials: ["Cuero (por confirmar)"],
    collections: ["oficina"],
    publishedAt: "2026-03-09",
    rank: 72,
  },
  {
    code: "FOR03",
    slug: "oxford-noche-negro",
    name: "Oxford Noche",
    shortDescription: "Negro formal.",
    description: "Zapato formal negro para ocasiones especiales. Producto de demostración.",
    category: "formal",
    gender: "hombre",
    price: 459900,
    colors: ["negro"],
    photo: "zapato-formal-negro",
    materials: ["Material por confirmar"],
    publishedAt: "2026-02-15",
    rank: 50,
  },
  {
    code: "FOR04",
    slug: "tacon-punta-blanco",
    name: "Tacón Punta",
    shortDescription: "Punta fina, blanco.",
    description: "Zapato de tacón alto de punta fina en blanco. Producto de demostración.",
    category: "formal",
    gender: "mujer",
    price: 349900,
    colors: ["blanco", "negro"],
    photo: "stiletto-blanco",
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
      "Bota de cuero café con cordones pensada para clima frío y lluvia. Datos de demostración: impermeabilidad no verificada.",
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
    slug: "botin-gamuza-cafe",
    name: "Botín Gamuza",
    shortDescription: "Gamuza café, suela clara.",
    description: "Botín de gamuza café con suela clara. Producto de demostración.",
    category: "botas",
    gender: "hombre",
    price: 419900,
    colors: ["cafe"],
    photo: "botin-gamuza",
    materials: ["Gamuza (por confirmar)"],
    collections: ["esenciales"],
    publishedAt: "2026-07-22",
    rank: 68,
  },
  {
    code: "BOT03",
    slug: "bota-taller-cafe",
    name: "Bota Taller",
    shortDescription: "Robusta y en cuero café.",
    description: "Bota café de aspecto robusto. Producto de demostración.",
    category: "botas",
    gender: "hombre",
    price: 529900,
    colors: ["cafe"],
    photo: "bota-cafe-detalle",
    materials: ["Material por confirmar"],
    publishedAt: "2026-01-30",
    rank: 55,
  },
  {
    code: "BOT04",
    slug: "botin-chelsea-negro",
    name: "Botín Chelsea",
    shortDescription: "Negro, elástico lateral.",
    description: "Botín tipo Chelsea en cuero negro. Producto de demostración.",
    category: "botas",
    gender: "unisex",
    price: 399900,
    colors: ["negro"],
    photo: "chelsea-negro-madera",
    materials: ["Cuero (por confirmar)"],
    collections: ["oficina"],
    isNew: true,
    publishedAt: "2026-10-18",
    rank: 78,
  },
  {
    code: "BOT05",
    slug: "bota-sendero-negra",
    name: "Bota Sendero",
    shortDescription: "Negra, de cordones.",
    description: "Bota negra de cordones para caminar. Producto de demostración.",
    category: "botas",
    gender: "mujer",
    price: 459900,
    colors: ["negro"],
    photo: "bota-negra-grava",
    materials: ["Material por confirmar"],
    collections: ["fin-de-semana"],
    publishedAt: "2026-05-05",
    rank: 42,
  },
  {
    code: "BOT06",
    slug: "botin-urbano-negro",
    name: "Botín Urbano",
    shortDescription: "Cuero negro, línea simple.",
    description: "Botín de cuero negro de líneas simples. Producto de demostración.",
    category: "botas",
    gender: "mujer",
    price: 479900,
    colors: ["negro", "cafe"],
    photo: "botin-negro-cuero",
    materials: ["Cuero (por confirmar)"],
    publishedAt: "2026-06-01",
    rank: 58,
  },
  // ── Sandalias ─────────────────────────────────────────────
  {
    code: "SAN01",
    slug: "sandalia-prado",
    name: "Sandalia Prado",
    shortDescription: "Cuero negro y café.",
    description: "Sandalia de cuero para clima cálido. Producto de demostración.",
    category: "sandalias",
    gender: "hombre",
    price: 179900,
    colors: ["negro"],
    photo: "sandalia-negro-cafe",
    materials: ["Cuero (por confirmar)"],
    collections: ["fin-de-semana"],
    featured: true,
    publishedAt: "2026-09-25",
    rank: 82,
  },
  {
    code: "SAN02",
    slug: "sandalia-costa-negra",
    name: "Sandalia Costa",
    shortDescription: "Tiras negras para viajar.",
    description: "Sandalia de cuero negro. Producto de demostración.",
    category: "sandalias",
    gender: "unisex",
    price: 159900,
    colors: ["negro"],
    photo: "sandalia-negra-puesta",
    materials: ["Cuero (por confirmar)"],
    publishedAt: "2026-04-28",
    rank: 52,
  },
  {
    code: "SAN03",
    slug: "sandalia-plataforma-vino",
    name: "Sandalia Plataforma",
    shortDescription: "Plataforma color vino.",
    description: "Sandalia de plataforma en color vino. Producto de demostración.",
    category: "sandalias",
    gender: "mujer",
    price: 189900,
    colors: ["vino"],
    photo: "plataforma-vino",
    materials: ["Material por confirmar"],
    isNew: true,
    publishedAt: "2026-10-22",
    rank: 48,
  },
  // ── Otros estilos ─────────────────────────────────────────
  {
    code: "OTR01",
    slug: "alpargata-sol-naranja",
    name: "Alpargata Sol",
    shortDescription: "Lona naranja y suela de yute.",
    description: "Alpargata naranja para clima cálido. Producto de demostración: materiales por confirmar.",
    category: "otros",
    gender: "unisex",
    price: 129900,
    colors: ["naranja"],
    photo: "alpargata-naranja",
    materials: ["Lona (por confirmar)", "Suela de yute (por confirmar)"],
    publishedAt: "2026-03-30",
    rank: 44,
  },
];

export const demoProducts: Product[] = specs.map(build);
