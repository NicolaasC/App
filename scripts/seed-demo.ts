/**
 * Carga el catálogo de DEMOSTRACIÓN en la base de datos indicada por DATABASE_URL.
 * Uso: DATABASE_URL=postgres://... npm run db:seed-demo [-- --reset-stock]
 * No ejecutar contra producción con clientes reales.
 */
import postgres from "postgres";
import { demoCategories } from "../src/data/demo/categories";
import { demoProducts } from "../src/data/demo/products";
import { seedCatalog } from "../src/server/catalog/seed";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL");
  process.exit(1);
}
const sql = postgres(url, { prepare: false, onnotice: () => {} });
try {
  await seedCatalog(sql, demoCategories, demoProducts, { resetStock: process.argv.includes("--reset-stock") });
  console.log(`Catálogo demo cargado: ${demoCategories.length} categorías, ${demoProducts.length} productos.`);
} finally {
  await sql.end();
}
