import "server-only";
import postgres from "postgres";

/**
 * Conexión a PostgreSQL (Supabase). En Vercel usar la cadena del
 * "transaction pooler" (puerto 6543); por eso `prepare: false`.
 */
export type Sql = postgres.Sql;
export type Tx = postgres.TransactionSql;

let client: Sql | null = null;

export function createSql(url: string): Sql {
  return postgres(url, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    // Nunca registrar parámetros: pueden contener datos personales.
    debug: false,
    onnotice: () => {},
  });
}

export function getSql(): Sql | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  client ??= createSql(url);
  return client;
}
