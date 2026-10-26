import { z } from "zod";
import { COLOMBIA_DEPARTMENTS, normalizeColombianPhone } from "@/lib/geo/colombia";
import { MAX_CART_LINES } from "@/lib/cart/cart";
import { MAX_QUANTITY_PER_LINE } from "@/lib/catalog/variants";

/** Esquemas compartidos por el formulario (cliente) y las acciones (servidor). */

export const cartLinesSchema = z
  .array(
    z.object({
      sku: z.string().trim().min(1).max(64),
      quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
      expectedUnitPrice: z.number().nonnegative().optional(),
    }),
  )
  .max(MAX_CART_LINES);

export type CartLineInput = z.infer<typeof cartLinesSchema>[number];

const text = (label: string, max: number) =>
  z
    .string({ error: `Ingresa ${label}.` })
    .trim()
    .min(1, `Ingresa ${label}.`)
    .max(max, `Máximo ${max} caracteres.`);

export const shippingAddressSchema = z.object({
  firstName: text("tu nombre", 60),
  lastName: text("tu apellido", 60),
  email: z
    .string({ error: "Ingresa tu correo electrónico." })
    .trim()
    .toLowerCase()
    .pipe(z.email("Revisa el correo: parece incompleto (ej. nombre@correo.com).")),
  phone: z
    .string({ error: "Ingresa un teléfono." })
    .transform((v, ctx) => {
      const phone = normalizeColombianPhone(v);
      if (!phone) {
        ctx.addIssue({
          code: "custom",
          message: "Ingresa un celular de 10 dígitos (ej. 300 123 4567) o un fijo 60X.",
        });
        return z.NEVER;
      }
      return phone;
    }),
  department: z.enum(COLOMBIA_DEPARTMENTS, { error: "Selecciona un departamento." }),
  city: text("la ciudad o municipio", 80),
  address: text("la dirección", 160).refine((v) => /\d/.test(v), {
    message: "Incluye el número de la dirección (ej. Calle 72 # 10-34).",
  }),
  addressDetails: z.string().trim().max(160, "Máximo 160 caracteres.").optional().default(""),
  postalCode: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || /^\d{6}$/.test(v), "El código postal tiene 6 dígitos."),
});

export const checkoutSchema = z.object({
  address: shippingAddressSchema,
  shippingMethodId: z.string().min(1, "Selecciona un método de entrega."),
  paymentMethod: z.enum(["wompi"], { error: "Selecciona un método de pago." }),
  acceptTerms: z.literal(true, { error: "Debes aceptar los términos y la política de privacidad." }),
  lines: cartLinesSchema.min(1, "Tu carrito está vacío."),
  /** Clave generada por el navegador para evitar pedidos duplicados por doble envío. */
  idempotencyKey: z.string().uuid("Solicitud inválida, recarga la página."),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;

export type FieldErrors = Record<string, string>;

/** Aplana errores de zod a { "address.email": "mensaje" }. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

export const newsletterSchema = z.object({
  email: z
    .string({ error: "Ingresa tu correo electrónico." })
    .trim()
    .toLowerCase()
    .pipe(z.email("Revisa el correo: parece incompleto.")),
  consent: z.literal(true, { error: "Debes autorizar el tratamiento de tus datos para suscribirte." }),
});
