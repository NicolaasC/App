/**
 * Contenido de páginas informativas. Son BORRADORES: describen qué falta
 * definir y citan el marco normativo colombiano de referencia. No constituyen
 * asesoría legal; deben revisarse con un abogado antes del lanzamiento.
 */
export interface InfoSection {
  title: string;
  paragraphs: string[];
}

export interface InfoPage {
  slug: string;
  title: string;
  description: string;
  status: "pendiente" | "borrador" | "aprobado";
  sections: InfoSection[];
}

export const infoPages = {
  nosotros: {
    slug: "nosotros",
    title: "Nosotros",
    description: "Quiénes somos.",
    status: "pendiente",
    sections: [
      {
        title: "Contenido pendiente",
        paragraphs: [
          "La marca todavía no está definida. Aquí se presentará la historia y la propuesta de la tienda cuando el negocio la confirme.",
        ],
      },
    ],
  },
  contacto: {
    slug: "contacto",
    title: "Contacto",
    description: "Canales de atención al cliente.",
    status: "pendiente",
    sections: [
      {
        title: "Canales de atención",
        paragraphs: [
          "Los canales de atención (correo, teléfono o WhatsApp, horario y dirección para notificaciones) están pendientes de confirmar.",
          "La Ley 1480 de 2011 exige informar al consumidor la identidad del vendedor y sus datos de contacto en las ventas a distancia.",
        ],
      },
    ],
  },
  "preguntas-frecuentes": {
    slug: "preguntas-frecuentes",
    title: "Preguntas frecuentes",
    description: "Respuestas a las dudas más comunes.",
    status: "borrador",
    sections: [
      {
        title: "¿Cómo elijo mi talla?",
        paragraphs: [
          "Usamos numeración europea (EU). En cada producto encontrarás una guía con la longitud aproximada del pie; las equivalencias pueden variar según el fabricante.",
        ],
      },
      {
        title: "¿Qué medios de pago aceptan?",
        paragraphs: ["Pendiente: la pasarela de pagos aún no está contratada."],
      },
      {
        title: "¿Cuánto tarda mi pedido?",
        paragraphs: ["Pendiente: la transportadora y los tiempos de entrega aún no están definidos."],
      },
    ],
  },
  envios: {
    slug: "envios",
    title: "Envíos",
    description: "Cobertura, costos y tiempos de entrega.",
    status: "pendiente",
    sections: [
      {
        title: "Estado actual",
        paragraphs: [
          "La tienda está en desarrollo. Las tarifas que se muestran en el checkout son de demostración y no corresponden a un servicio contratado.",
          "Por definir: transportadora, cobertura por municipio, tarifas, tiempos estimados, envío gratuito y restricciones de entrega.",
        ],
      },
    ],
  },
  "cambios-y-devoluciones": {
    slug: "cambios-y-devoluciones",
    title: "Cambios y devoluciones",
    description: "Política de cambios, retracto y garantías.",
    status: "borrador",
    sections: [
      {
        title: "Política de cambios",
        paragraphs: ["Pendiente: plazos, condiciones del producto y procedimiento para solicitar un cambio por talla o color."],
      },
      {
        title: "Derecho de retracto",
        paragraphs: [
          "En ventas a distancia el consumidor puede ejercer el derecho de retracto dentro de los cinco (5) días hábiles siguientes a la entrega (artículo 47 de la Ley 1480 de 2011). El procedimiento de la tienda está pendiente de definir.",
        ],
      },
      {
        title: "Reversión del pago",
        paragraphs: [
          "En los casos previstos por el artículo 51 de la Ley 1480 de 2011 (y su reglamentación en el Decreto 1074 de 2015), el consumidor puede solicitar la reversión del pago. Pendiente de definir el canal para tramitarla.",
        ],
      },
      {
        title: "Garantía",
        paragraphs: ["Pendiente: términos de garantía legal de los productos y canal para reclamaciones."],
      },
    ],
  },
  privacidad: {
    slug: "privacidad",
    title: "Privacidad y tratamiento de datos personales",
    description: "Política de tratamiento de datos personales.",
    status: "borrador",
    sections: [
      {
        title: "Marco aplicable",
        paragraphs: [
          "El tratamiento de datos personales en Colombia se rige por la Ley 1581 de 2012 y su reglamentación (Decreto 1377 de 2013, compilado en el Decreto 1074 de 2015). La autoridad de control es la Superintendencia de Industria y Comercio.",
        ],
      },
      {
        title: "Datos que recogería la tienda",
        paragraphs: [
          "Para gestionar pedidos: nombre, correo, teléfono y dirección de entrega. Para el boletín, solo el correo con autorización expresa. La tienda no almacena números de tarjeta ni códigos de seguridad: los pagos los procesará la pasarela.",
        ],
      },
      {
        title: "Pendiente antes del lanzamiento",
        paragraphs: [
          "Identificación del responsable del tratamiento, finalidades, derechos del titular (conocer, actualizar, rectificar, suprimir y revocar la autorización), procedimiento y canal para consultas y reclamos, fecha de vigencia y, si aplica, inscripción en el Registro Nacional de Bases de Datos.",
        ],
      },
    ],
  },
  terminos: {
    slug: "terminos",
    title: "Términos y condiciones",
    description: "Condiciones de uso y de compra.",
    status: "borrador",
    sections: [
      {
        title: "Estado",
        paragraphs: [
          "Borrador pendiente de revisión legal. Las condiciones definitivas deben incluir la identidad del vendedor, características de los productos, precios con impuestos incluidos, medios de pago, plazos de entrega, derecho de retracto, garantías y mecanismos de atención (Ley 1480 de 2011, Ley 527 de 1999).",
          "Mientras la tienda esté en modo de demostración no se celebran contratos de compraventa ni se procesan pagos.",
        ],
      },
    ],
  },
} satisfies Record<string, InfoPage>;

export type InfoPageSlug = keyof typeof infoPages;
