/**
 * Identidad comercial y contenido editorial centralizados.
 *
 * Todo lo que aparece aquí es PROVISIONAL hasta que el negocio confirme marca,
 * datos de contacto y condiciones comerciales. Los campos `null` se ocultan en
 * la interfaz: no inventar valores para rellenarlos.
 */

export type BenefitKey = "pagos" | "cambios" | "envios" | "atencion";

export interface Benefit {
  key: BenefitKey;
  title: string;
  description: string;
  /** Solo se muestra si existe una condición comercial real que lo respalde. */
  enabled: boolean;
}

export const siteConfig = {
  brand: {
    /** Nombre provisional neutral. Cambiarlo aquí actualiza toda la tienda. */
    name: "Calzado Estudio",
    wordmark: "Estudio",
    isProvisional: true,
    tagline: "Calzado para cada paso",
    description:
      "Tienda online de calzado en Colombia: sneakers, casual, formal, botas y sandalias.",
  },
  locale: "es-CO",
  currency: "COP",
  country: "CO",
  /** URL pública. En Vercel se completa con NEXT_PUBLIC_SITE_URL. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  /** Indexación: desactivada mientras el catálogo sea de demostración. */
  indexable: process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true",

  announcement: {
    enabled: false,
    message: "",
    href: null as string | null,
  },

  hero: {
    eyebrow: "Colección de demostración",
    title: "Estilo para cada paso.",
    subtitle: "Encuentra el calzado que acompaña tu forma de vivir.",
    primaryCta: { label: "Explorar colección", href: "/catalogo" },
    secondaryCta: { label: "Descubrir novedades", href: "/catalogo?orden=novedades" },
    /** ID de imagen en src/data/demo/images.ts */
    imageId: "lifestyle-calle-sombras",
  },

  editorial: {
    eyebrow: "Nuestra mirada",
    title: "Menos ruido, mejores pasos.",
    body: [
      "Texto provisional: aquí irá la filosofía de la marca cuando esté definida.",
      "Una selección cuidada de calzado para el día a día, el trabajo y los fines de semana, presentada con claridad para que elegir sea sencillo.",
    ],
    cta: { label: "Ver el catálogo", href: "/catalogo" },
    imageId: "lifestyle-banca",
  },

  /** Colecciones destacadas en la home. Los productos salen del catálogo por etiqueta. */
  homeCollections: ["esenciales", "fin-de-semana"],

  benefits: [
    {
      key: "pagos",
      title: "Pagos seguros",
      description: "Pendiente: definir pasarela y medios de pago.",
      enabled: false,
    },
    {
      key: "cambios",
      title: "Cambios",
      description: "Pendiente: definir política de cambios y devoluciones.",
      enabled: false,
    },
    {
      key: "envios",
      title: "Envíos",
      description: "Pendiente: definir transportadora, cobertura y tiempos.",
      enabled: false,
    },
    {
      key: "atencion",
      title: "Atención al cliente",
      description: "Pendiente: definir canales y horarios de atención.",
      enabled: false,
    },
  ] satisfies Benefit[],

  newsletter: {
    enabled: true,
    title: "Novedades por correo",
    description:
      "Recibe lanzamientos y noticias de la tienda. Puedes darte de baja cuando quieras.",
  },

  /** Datos de contacto y legales. `null` = pendiente, no se muestra. */
  contact: {
    email: null as string | null,
    phone: null as string | null,
    whatsapp: null as string | null,
    address: null as string | null,
    hours: null as string | null,
  },
  legal: {
    companyName: null as string | null,
    nit: null as string | null,
  },
  social: [] as { label: string; href: string }[],
} as const;

export type SiteConfig = typeof siteConfig;
