/**
 * Configuración logística. MODO DEMOSTRACIÓN: las tarifas son valores de
 * ejemplo para probar el flujo y se muestran etiquetadas como tales. No hay
 * transportadora contratada ni tiempos de entrega confirmados.
 *
 * Para activar tarifas reales: cambiar `mode` a "live", definir transportadora,
 * zonas y tarifas acordadas, y revisar docs/envios.md.
 */

export interface ShippingZone {
  id: string;
  label: string;
  /** Departamentos incluidos (nombres de src/lib/geo/colombia.ts). "*" = resto del país. */
  departments: string[] | "*";
  rate: number;
  /** Texto de tiempo estimado; null = no confirmado (no se muestra un plazo). */
  estimatedTime: string | null;
}

export interface ShippingMethod {
  id: string;
  label: string;
  carrier: string | null;
  zones: ShippingZone[];
}

export interface ShippingConfig {
  mode: "demo" | "live" | "disabled";
  /** Subtotal a partir del cual el envío es gratis; null = no existe esa regla. */
  freeShippingThreshold: number | null;
  methods: ShippingMethod[];
  /** Restricciones de entrega a mostrar en checkout. */
  restrictions: string[];
}

export const shippingConfig: ShippingConfig = {
  mode: "demo",
  freeShippingThreshold: null,
  methods: [
    {
      id: "estandar",
      label: "Envío estándar a domicilio",
      carrier: null,
      zones: [
        { id: "bogota", label: "Bogotá D. C.", departments: ["Bogotá D. C."], rate: 12000, estimatedTime: null },
        { id: "nacional", label: "Resto del país", departments: "*", rate: 18000, estimatedTime: null },
      ],
    },
  ],
  restrictions: [],
};
