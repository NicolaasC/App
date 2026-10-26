import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { demoCategories } from "@/data/demo/categories";
import type { Product } from "@/lib/catalog/types";
import { seedCatalog } from "@/server/catalog/seed";

/**
 * Crea una base de datos desechable con la migración aplicada.
 * Requiere TEST_DATABASE_URL apuntando a un PostgreSQL local con permisos de
 * superusuario (NUNCA a Supabase de producción).
 */
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

export async function createTestDatabase(name: string) {
  if (!TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL no definida");
  const admin = postgres(TEST_DATABASE_URL, { onnotice: () => {}, max: 1 });
  await admin.unsafe(`drop database if exists ${name} with (force)`);
  await admin.unsafe(`create database ${name}`);
  await admin.end();

  const url = new URL(TEST_DATABASE_URL);
  url.pathname = `/${name}`;
  const sql = postgres(url.toString(), { onnotice: () => {}, prepare: false, max: 10 });
  const root = path.resolve(import.meta.dirname, "../..");
  await sql.unsafe(await readFile(path.join(root, "supabase/tests/bootstrap-local.sql"), "utf8"));
  const dir = path.join(root, "supabase/migrations");
  for (const file of (await readdir(dir)).sort()) {
    await sql.unsafe(await readFile(path.join(dir, file), "utf8"));
  }
  return { sql, url: url.toString() };
}

export function testProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "TST01",
    slug: "bota-prueba",
    name: "Bota Prueba",
    shortDescription: "",
    description: "",
    category: "botas",
    gender: "unisex",
    price: 200000,
    colors: [{ id: "negro", name: "Negro", swatch: "#000" }],
    variants: [
      { sku: "TST01-NEG-38", colorId: "negro", size: 38, stock: 3 },
      { sku: "TST01-NEG-39", colorId: "negro", size: 39, stock: 1 },
    ],
    materials: [{ label: "Cuero (por confirmar)", verified: false }],
    images: [],
    collections: [],
    featured: false,
    isNew: false,
    publishedAt: "2026-01-01",
    status: "published",
    rank: 1,
    isDemo: true,
    ...overrides,
  };
}

export async function seedTestCatalog(sql: postgres.Sql, products: Product[] = [testProduct()]) {
  await seedCatalog(sql, demoCategories, products, { resetStock: true });
}
