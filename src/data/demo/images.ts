/**
 * Registro único de fotografías de demostración.
 *
 * Origen: API de Unsplash (conector), consultada el 26-oct-2026. Para cada foto
 * se verificó: gratuita (`premium: false`, licencia Unsplash), autor, y texto
 * alternativo publicado por Unsplash. Siguiendo las directrices de la API, las
 * imágenes se enlazan desde images.unsplash.com (hotlinking), se atribuye al
 * autor con enlace de referencia y su uso se registró con el endpoint de descarga.
 *
 * Son fotos de stock: NO muestran el producto que se vende. Sustituir por
 * fotografía propia antes del lanzamiento (ver docs/imagenes.md).
 */
import type { CatalogImage } from "@/lib/catalog/types";

interface PhotoEntry {
  /** ID público de la foto en Unsplash. */
  unsplashId: string;
  /** Ruta del archivo en images.unsplash.com (sin parámetros). */
  path: string;
  /** Slug de la página pública. */
  slug: string;
  author: string;
  username: string;
  /** Texto alternativo en español, basado en la descripción publicada. */
  alt: string;
  width: number;
  height: number;
  focal?: string;
}

const APP_REF = "utm_source=tienda_calzado_demo&utm_medium=referral";

export const demoPhotos = {
  // ── Sneakers ──────────────────────────────────────────────
  "sneaker-negro-suela-blanca": {
    unsplashId: "sd-VmUUrdrw",
    path: "photo-1676379760823-ebf91f45de0b",
    slug: "a-pair-of-black-and-white-sneakers-on-a-white-surface",
    author: "Maria Fernanda Pissioli",
    username: "mxpissioli",
    alt: "Par de tenis negros con suela blanca sobre una superficie blanca",
    width: 3456,
    height: 5184,
  },
  "sneaker-blanco-calle": {
    unsplashId: "WO2aXfjOHbY",
    path: "photo-1771502244768-a9671a764b2e",
    slug: "person-wearing-white-sneakers-on-a-brick-path",
    author: "atelierbyvineeth",
    username: "atelierbyvineeth",
    alt: "Persona con tenis blancos caminando sobre un camino de ladrillo",
    width: 5420,
    height: 3613,
  },
  "sneaker-negro-cana-baja": {
    unsplashId: "xPY70gYcbcI",
    path: "photo-1496202703211-aa28e9500c30",
    slug: "person-showing-black-low-top-sneakers",
    author: "Manki Kim",
    username: "kimdonkey",
    alt: "Persona con tenis negros de caña baja",
    width: 5337,
    height: 3558,
  },
  "sneaker-cafe-blanco": {
    unsplashId: "_D5aCBa1ygo",
    path: "photo-1697086317645-11bd9e74e2cf",
    slug: "a-persons-feet-wearing-brown-and-white-tennis-shoes",
    author: "Valeriia Miller",
    username: "valeriiamiller",
    alt: "Pies con tenis en tonos café y blanco",
    width: 6240,
    height: 4160,
  },
  "sneaker-bicolor-sabana": {
    unsplashId: "q1CxL4K-fIg",
    path: "photo-1641997465126-c73cc4070337",
    slug: "a-pair-of-black-and-white-sneakers-on-a-white-sheet",
    author: "Axel Bimashanda",
    username: "axelbimashanda",
    alt: "Par de tenis blanco y negro sobre una sábana blanca",
    width: 4000,
    height: 6000,
  },
  // ── Casual ────────────────────────────────────────────────
  "mocasin-gamuza-cafe": {
    unsplashId: "KOavcW0p7oc",
    path: "photo-1676121270762-47c8d3a7b9d5",
    slug: "a-pair-of-brown-suede-loafers-with-gold-hardwares",
    author: "Nelibar Shoes",
    username: "nelibar",
    alt: "Par de mocasines de gamuza café con herraje dorado",
    width: 3620,
    height: 2160,
  },
  "mocasin-cuero-cafe": {
    unsplashId: "LkuH3Txi_gs",
    path: "photo-1616406432452-07bc5938759d",
    slug: "brown-leather-loafers-on-blue-textile",
    author: "Noah Smith",
    username: "noahsmith",
    alt: "Mocasines de cuero café sobre tela azul",
    width: 6382,
    height: 4254,
  },
  "zapato-cuero-cafe": {
    unsplashId: "5_zKOE-kPkw",
    path: "photo-1662541089338-c7d53b88be70",
    slug: "a-pair-of-brown-leather-shoes",
    author: "Stanley G. Mathu",
    username: "mathustans",
    alt: "Par de zapatos de cuero café",
    width: 6000,
    height: 4000,
  },
  "mocasin-negro-fondo-blanco": {
    unsplashId: "NySU2CFS9Eo",
    path: "photo-1760616172899-0681b97a2de3",
    slug: "black-loafers-with-white-background",
    author: "taha siddiqui",
    username: "xxtahaxx",
    alt: "Mocasines negros sobre fondo blanco",
    width: 4160,
    height: 6240,
  },
  // ── Formal ────────────────────────────────────────────────
  "brogue-cafe-beige": {
    unsplashId: "dYgEvR2gdgk",
    path: "photo-1641893843833-a006778dc00b",
    slug: "a-pair-of-shoes-dYgEvR2gdgk",
    author: "Collab Media",
    username: "collab_media",
    alt: "Zapatos brogue cafés para hombre sobre fondo beige",
    width: 4910,
    height: 3367,
  },
  "derby-cuero-cafe": {
    unsplashId: "99NxpMVxWDA",
    path: "photo-1603191659812-ee978eeeef76",
    slug: "brown-leather-lace-up-shoes",
    author: "Monaal Garg",
    username: "garg_monaal",
    alt: "Zapatos de cuero café con cordones",
    width: 6000,
    height: 4000,
  },
  "zapato-formal-negro": {
    unsplashId: "2nST4hbvTkc",
    path: "photo-1668069226492-508742b03147",
    slug: "a-pair-of-black-shoes",
    author: "Davinder Singh",
    username: "davinder62399",
    alt: "Par de zapatos formales negros",
    width: 6000,
    height: 4000,
  },
  "stiletto-blanco": {
    unsplashId: "BI9NjChWn6s",
    path: "photo-1562687848-c1664eff566d",
    slug: "white-leather-pointed-toe-stiletto",
    author: "Jonathan Borba",
    username: "jonathanborba",
    alt: "Zapato de tacón blanco de punta fina",
    width: 3648,
    height: 5472,
  },
  // ── Botas ─────────────────────────────────────────────────
  "bota-cordon-cafe": {
    unsplashId: "esxf7PJmExQ",
    path: "photo-1608256246200-53e635b5b65f",
    slug: "brown-leather-lace-up-boots",
    author: "Zac Wolff",
    username: "zacwolff",
    alt: "Botas de cuero café con cordones",
    width: 5075,
    height: 7609,
  },
  "botin-gamuza": {
    unsplashId: "miNo_SFAcws",
    path: "photo-1608629601270-a0007becead3",
    slug: "brown-and-white-suede-boots",
    author: "Noah Smith",
    username: "noahsmith",
    alt: "Botines de gamuza café con suela clara",
    width: 6720,
    height: 4480,
  },
  "bota-cafe-detalle": {
    unsplashId: "3OZr-hLbsq0",
    path: "photo-1605733160314-4fc7dac4bb16",
    slug: "a-close-up-of-a-pair-of-brown-boots",
    author: "mostafa mahmoudi",
    username: "mostafa_mahmoudi24",
    alt: "Primer plano de un par de botas cafés",
    width: 5474,
    height: 3568,
  },
  "chelsea-negro-madera": {
    unsplashId: "abv1EdKdRnU",
    path: "photo-1788478963160-1c38139e2932",
    slug: "black-leather-boots-on-wooden-floor",
    author: "Lachlan Rennie",
    username: "rennielachlan",
    alt: "Botines Chelsea de cuero negro sobre piso de madera oscura",
    width: 3319,
    height: 4979,
  },
  "bota-negra-grava": {
    unsplashId: "MCdCebbKACs",
    path: "photo-1760817074821-329c6a9e78d9",
    slug: "black-lace-up-boots-on-a-gravel-path",
    author: "T",
    username: "tanyabarrow",
    alt: "Botas negras de cordones sobre un camino de grava",
    width: 3479,
    height: 5097,
  },
  "botin-negro-cuero": {
    unsplashId: "_D7x0SJjiSs",
    path: "photo-1534233812932-59b8fa1b780c",
    slug: "pair-of-black-leather-boots-on-brown-surface",
    author: "Jia Ye",
    username: "jimmy2018",
    alt: "Par de botines de cuero negro sobre superficie café",
    width: 5307,
    height: 2985,
  },
  // ── Sandalias ─────────────────────────────────────────────
  "sandalia-negro-cafe": {
    unsplashId: "-JM9hYDw8iY",
    path: "photo-1585120824848-8a5cd41493d2",
    slug: "black-and-brown-leather-sandals",
    author: "Kushagrta Roy",
    username: "kushagrta",
    alt: "Sandalias de cuero negro y café",
    width: 5504,
    height: 8256,
  },
  "sandalia-negra-puesta": {
    unsplashId: "LyJAczPSwo0",
    path: "photo-1628375385879-1af64230c2e1",
    slug: "person-wearing-black-leather-sandals",
    author: "DCL \"650\"",
    username: "dclmister",
    alt: "Persona con sandalias de cuero negro",
    width: 4000,
    height: 5000,
  },
  "plataforma-vino": {
    unsplashId: "DDqxX0-7vKE",
    path: "photo-1562273138-f46be4ebdf33",
    slug: "pair-of-maroon-wedges",
    author: "Irene Kredenets",
    username: "ikredenets",
    alt: "Par de sandalias de plataforma color vino",
    width: 2769,
    height: 3462,
  },
  // ── Otros estilos ─────────────────────────────────────────
  "alpargata-naranja": {
    unsplashId: "OrubLvISGZc",
    path: "photo-1565953198075-db265882ee68",
    slug: "orange-espadrilles",
    author: "Apostolos Vamvouras",
    username: "apostolosv",
    alt: "Alpargatas naranjas",
    width: 3000,
    height: 4000,
  },
  // ── Estilo de vida / editorial ────────────────────────────
  "lifestyle-calle-sombras": {
    unsplashId: "k_ObqD92Mv0",
    path: "photo-1767546787465-259cc0dfb128",
    slug: "people-walking-on-a-street-with-long-shadows",
    author: "Jirath Ninchaikovit",
    username: "ppepea",
    alt: "Personas caminando por una calle con sombras largas",
    width: 6000,
    height: 4000,
  },
  "lifestyle-banca": {
    unsplashId: "hAFOazkTgqM",
    path: "photo-1631978278971-9afda1670882",
    slug: "a-person-sitting-on-a-bench",
    author: "David Karp.",
    username: "karpic",
    alt: "Persona sentada en una banca con mocasines",
    width: 4000,
    height: 6000,
    focal: "50% 75%",
  },
  "lifestyle-cuatro-pares": {
    unsplashId: "ftW49Xcyv0Q",
    path: "photo-1770505003951-c968c56421b9",
    slug: "four-pairs-of-shoes-on-a-light-floor",
    author: "Mikhail Mamaev",
    username: "mikhail_mamaev",
    alt: "Cuatro pares de zapatos sobre un piso claro, en blanco y negro",
    width: 4716,
    height: 4716,
  },
  "lifestyle-camino": {
    unsplashId: "r7dVa_N1FSY",
    path: "photo-1635252261174-aa7945dc2902",
    slug: "a-person-standing-on-a-gravel-road-with-their-shoes-on",
    author: "Youcef Chenzer",
    username: "chenzer",
    alt: "Persona de pie en un camino de grava",
    width: 5184,
    height: 3456,
  },
} satisfies Record<string, PhotoEntry>;

export type DemoPhotoId = keyof typeof demoPhotos;

export const UNSPLASH_HOST = "images.unsplash.com";

export function demoImage(id: DemoPhotoId, options: { colorId?: string; alt?: string } = {}): CatalogImage {
  const photo: PhotoEntry = demoPhotos[id];
  return {
    id,
    src: `https://${UNSPLASH_HOST}/${photo.path}?ixlib=rb-4.1.0`,
    width: photo.width,
    height: photo.height,
    alt: options.alt ?? photo.alt,
    focal: photo.focal,
    colorId: options.colorId,
    provisional: true,
    credit: {
      author: photo.author,
      sourceUrl: `https://unsplash.com/photos/${photo.slug.endsWith(photo.unsplashId) ? photo.slug : `${photo.slug}-${photo.unsplashId}`}?${APP_REF}`,
      authorUrl: `https://unsplash.com/@${photo.username}?${APP_REF}`,
      license: "Unsplash License",
    },
  };
}

export function isDemoPhotoId(id: string): id is DemoPhotoId {
  return Object.prototype.hasOwnProperty.call(demoPhotos, id);
}

export const demoPhotoUnsplashIds = Object.values(demoPhotos).map((p) => p.unsplashId);
