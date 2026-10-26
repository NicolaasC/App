import "server-only";
import { z } from "zod";

/**
 * Variables de entorno del servidor. Nunca importar desde componentes cliente
 * (`server-only` lo impide en build). Las vacías se tratan como no configuradas.
 */
const optional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const schema = z.object({
  CATALOG_SOURCE: z.enum(["demo", "supabase"]).default("demo"),
  SUPABASE_URL: optional,
  SUPABASE_SERVICE_ROLE_KEY: optional,
  PAYMENTS_PROVIDER: z.enum(["none", "wompi"]).default("none"),
  WOMPI_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  WOMPI_PUBLIC_KEY: optional,
  WOMPI_PRIVATE_KEY: optional,
  WOMPI_INTEGRITY_SECRET: optional,
  WOMPI_EVENTS_SECRET: optional,
  ORDER_TOKEN_SECRET: optional,
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (!cached) cached = schema.parse(process.env);
  return cached;
}

/** Solo para pruebas. */
export function resetServerEnvCache() {
  cached = null;
}

export function isDatabaseConfigured(env = serverEnv()): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isWompiConfigured(env = serverEnv()): boolean {
  return (
    env.PAYMENTS_PROVIDER === "wompi" &&
    Boolean(env.WOMPI_PUBLIC_KEY && env.WOMPI_INTEGRITY_SECRET && env.WOMPI_EVENTS_SECRET)
  );
}
