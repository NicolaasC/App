/**
 * Registro único de fotografías de demostración.
 *
 * Procedencia: fotos de unsplash.com identificadas mediante búsqueda web y
 * publicadas bajo la Unsplash License (uso comercial gratuito, sin atribución
 * obligatoria). Limitaciones conocidas — ver docs/imagenes.md:
 *  - No se pudieron revisar visualmente desde el entorno de desarrollo (red
 *    restringida). El contenido se describe según el título público de cada foto.
 *  - Son fotos de stock, NO del producto que se vende. Algunas pueden mostrar
 *    logotipos de terceros. Sustituir por fotografía propia antes del lanzamiento.
 *  - La licencia debe confirmarse en la página de cada foto (Unsplash+ es de pago).
 *
 * Los archivos se descargan con `npm run images:fetch`, que genera
 * downloaded-images.json. Si un archivo falta, la interfaz muestra un placeholder.
 */
import type { CatalogImage } from "@/lib/catalog/types";
import downloaded from "./downloaded-images.json";

interface PhotoEntry {
  /** ID público de la foto en Unsplash. */
  unsplashId: string;
  /** Slug descriptivo de la página de origen. */
  slug: string;
  author: string | null;
  alt: string;
  focal?: string;
}

type DownloadedMap = Record<string, { file: string; width: number; height: number }>;

export const demoPhotos = {
  // Sneakers
  "sneaker-gris-minimal": {
    unsplashId: "Px3xY9WT0BE",
    slug: "pair-of-gray-basketball-shoes",
    author: "Junior Samson",
    alt: "Par de tenis grises de caña baja sobre fondo neutro",
  },
  "sneaker-blanco-urbano": {
    unsplashId: "QrgRNPSku4c",
    slug: "person-wearing-white-low-top-sneakers",
    author: null,
    alt: "Persona con tenis blancos de caña baja",
  },
  "sneaker-sobre-caja": {
    unsplashId: "LvwH3h_KGco",
    slug: "a-pair-of-sneakers-sitting-on-top-of-a-box",
    author: "Sahej Brar",
    alt: "Par de tenis sobre una caja",
  },
  "sneaker-blanco-naranja": {
    unsplashId: "dwKiHoqqxk8",
    slug: "pair-of-white-and-orange-athletic-shoes-on-white-box",
    author: "Irene Kredenets",
    alt: "Tenis deportivos blancos con detalles naranja sobre una caja blanca",
  },
  "sneaker-dorado-azul": {
    unsplashId: "61Us1dv1WW8",
    slug: "a-pair-of-gold-and-blue-sneakers-on-a-black-background",
    author: null,
    alt: "Par de tenis dorados y azules sobre fondo negro",
  },
  // Casual
  "casual-mocasines-color": {
    unsplashId: "nZQGm6KGtXk",
    slug: "a-group-of-shoes",
    author: "Eric Prouzet",
    alt: "Mocasines y baletas de colores apilados sobre madera",
  },
  "casual-nautico-cafe": {
    unsplashId: "oYnexz9dM6A",
    slug: "person-wearing-pair-of-brown-boat-shoes-on-floor",
    author: null,
    alt: "Persona con zapatos náuticos cafés sobre el piso",
  },
  "casual-cordon-cafe": {
    unsplashId: "iycXFch44bo",
    slug: "focus-photography-of-pair-of-brown-low-top-lace-up-sneaker",
    author: "Arwan Sutanto",
    alt: "Zapato café de cordones y caña baja con uso visible",
  },
  "casual-blanco-banco": {
    unsplashId: "1NXsoyQaP5M",
    slug: "a-pair-of-white-shoes-sitting-on-top-of-a-wooden-stool",
    author: null,
    alt: "Par de zapatos blancos sobre un banco de madera",
  },
  // Formal
  "formal-brogue-cafe": {
    unsplashId: "LbCgZP4utcM",
    slug: "pair-of-brown-wingtip-shoes",
    author: "Greg Rosenke",
    alt: "Par de zapatos formales cafés con puntera brogue",
  },
  "formal-cuero-cafe": {
    unsplashId: "OjrDJfBE_Yg",
    slug: "pair-of-mens-brown-leather-shoes",
    author: "Erik-Jan Leusink",
    alt: "Par de zapatos de cuero café para hombre",
  },
  "formal-bicolor": {
    unsplashId: "n0WkNv3Lmcs",
    slug: "brown-and-black-dress-shoes",
    author: "Jon Tyson",
    alt: "Zapatos de vestir en tonos café y negro",
  },
  "formal-tacon-punta": {
    unsplashId: "Zx76sbAndc0",
    slug: "pair-of-womens-brown-pointed-toe-pumps-on-board",
    author: null,
    alt: "Par de zapatos de tacón cafés de punta fina sobre una tabla",
  },
  // Botas
  "bota-cordon-cafe": {
    unsplashId: "s8TQiOfGlz0",
    slug: "brown-leather-lace-up-boots",
    author: "Glenn Carstens-Peters",
    alt: "Botas de cuero café con cordones",
  },
  "bota-chukka": {
    unsplashId: "Q4IaRcu71hs",
    slug: "two-pairs-of-brown-leather-chukka-boots-and-booties",
    author: "Haley Phelps",
    alt: "Dos pares de botines chukka de cuero café sobre hojas secas",
  },
  "bota-piso-madera": {
    unsplashId: "WlB8TsI_th0",
    slug: "pair-of-brown-leather-lace-up-boots",
    author: "Radek Skrzypczak",
    alt: "Par de botas cafés de cordones sobre piso de madera",
  },
  "bota-negra": {
    unsplashId: "SzbQh_qrb3U",
    slug: "black-leather-boots-on-white-surface",
    author: "Benjamin R.",
    alt: "Botas de cuero negro sobre superficie blanca",
  },
  "bota-combate-bicolor": {
    unsplashId: "ydcMwcfY5E0",
    slug: "unpaired-black-and-white-leather-combat-boot",
    author: "Clark Street Mercantile",
    alt: "Bota de combate de cuero en blanco y negro",
  },
  "bota-tacon-negra": {
    unsplashId: "df21GwDh4_c",
    slug: "a-woman-in-a-black-outfit-and-high-heel-boots",
    author: null,
    alt: "Mujer vestida de negro con botas de tacón",
    focal: "50% 85%",
  },
  // Sandalias
  "sandalia-cuero-pasto": {
    unsplashId: "sNkpa8TLeFs",
    slug: "black-and-brown-leather-sandals-on-green-grass",
    author: "Stephanie Hau",
    alt: "Sandalias de cuero negro y café sobre pasto",
  },
  "sandalia-plana-tricolor": {
    unsplashId: "MDLZbKtor2s",
    slug: "person-wearing-pair-of-black-white-and-brown-leather-flatbed-sandals",
    author: "Alex Azabache",
    alt: "Persona con sandalias planas de cuero negro, blanco y café",
  },
  "sandalia-multicolor": {
    unsplashId: "9HzcOiNeSgA",
    slug: "woman-wearing-multicolored-flat-sandals",
    author: "Samia Liamani",
    alt: "Mujer con sandalias planas multicolor",
  },
  // Otros estilos
  "otros-negro-etiqueta": {
    unsplashId: "n06AhnTrlTQ",
    slug: "a-pair-of-black-shoes-next-to-an-orange-tag",
    author: null,
    alt: "Par de zapatos negros junto a una etiqueta naranja",
  },
  // Estilo de vida / editorial
  "lifestyle-street-walk": {
    unsplashId: "WTH_oSojv8A",
    slug: "person-in-black-pants-and-black-shoes-walking-on-street-during-daytime",
    author: "t Kaiser",
    alt: "Persona caminando por la calle con pantalón y zapatos negros",
    focal: "50% 70%",
  },
  "lifestyle-boots-pair": {
    unsplashId: "0tTycfO61xs",
    slug: "two-person-wearing-brown-leather-boots",
    author: "Don Ross III",
    alt: "Dos personas con botas de cuero café",
  },
  "lifestyle-calle": {
    unsplashId: "pAmqSVguAEc",
    slug: "a-persons-legs-and-shoes-on-a-street",
    author: "Amirhossein Hasani",
    alt: "Piernas y zapatos de una persona sobre la calle",
  },
  "lifestyle-cordones": {
    unsplashId: "PCdPvFQg1DA",
    slug: "a-person-tying-a-pair-of-brown-shoes",
    author: null,
    alt: "Persona amarrando los cordones de unos zapatos cafés",
  },
} satisfies Record<string, PhotoEntry>;

export type DemoPhotoId = keyof typeof demoPhotos;

const downloadedMap = downloaded as DownloadedMap;

export function demoImage(
  id: DemoPhotoId,
  options: { colorId?: string; alt?: string } = {},
): CatalogImage {
  const photo: PhotoEntry = demoPhotos[id];
  const file = downloadedMap[photo.unsplashId];
  return {
    id,
    src: file?.file ?? null,
    width: file?.width,
    height: file?.height,
    alt: options.alt ?? photo.alt,
    focal: photo.focal,
    colorId: options.colorId,
    provisional: true,
    credit: {
      author: photo.author,
      sourceUrl: `https://unsplash.com/photos/${photo.slug}-${photo.unsplashId}`,
      license: "Unsplash License",
    },
  };
}

export function isDemoPhotoId(id: string): id is DemoPhotoId {
  return Object.prototype.hasOwnProperty.call(demoPhotos, id);
}
