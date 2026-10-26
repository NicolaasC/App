"use server";

import { newsletterSchema } from "@/lib/validation/checkout";
import { isDatabaseConfigured } from "@/server/env";
import { checkRateLimit, clientKey } from "@/server/rate-limit";

export type NewsletterState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: { email?: string; consent?: string } }
  | { status: "unavailable"; message: string }
  | { status: "success"; message: string };

/**
 * Suscripción al boletín. Solo confirma éxito si el registro se guardó.
 * Mientras no exista base de datos, responde "no disponible" sin simular.
 */
export async function subscribeNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  if (!checkRateLimit(await clientKey("newsletter"), 5, 60_000)) {
    return { status: "error", message: "Demasiados intentos. Espera un minuto e inténtalo de nuevo." };
  }

  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    consent: formData.get("consent") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: { email?: string; consent?: string } = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "email" | "consent";
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Revisa los datos del formulario.", fieldErrors };
  }

  if (!isDatabaseConfigured()) {
    return {
      status: "unavailable",
      message: "La suscripción todavía no está activa en este sitio de demostración. No guardamos tu correo.",
    };
  }

  // Fase de backend: insertar en newsletter_subscriptions con consent_text,
  // consent_version, ip_hash y created_at (ver docs/modelo-de-datos.md).
  return {
    status: "unavailable",
    message: "La suscripción todavía no está activa. No guardamos tu correo.",
  };
}
