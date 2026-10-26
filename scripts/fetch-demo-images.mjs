#!/usr/bin/env node
/**
 * Descarga las fotos de demostración listadas en src/data/demo/images.ts
 * desde Unsplash (endpoint público de descarga de cada foto), las redimensiona
 * y genera src/data/demo/downloaded-images.json.
 *
 * Uso: npm run images:fetch [-- --force] [-- --strict]
 *  --force   vuelve a descargar aunque el archivo exista
 *  --strict  termina con error si alguna foto falla (por defecto solo avisa)
 *
 * Requiere acceso de red a unsplash.com e images.unsplash.com.
 */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const registry = path.join(root, "src/data/demo/images.ts");
const outDir = path.join(root, "public/images/demo");
const manifestPath = path.join(root, "src/data/demo/downloaded-images.json");
const force = process.argv.includes("--force");
const strict = process.argv.includes("--strict");
const MAX_WIDTH = 2000;

const source = await readFile(registry, "utf8");
const ids = [...new Set([...source.matchAll(/unsplashId:\s*"([A-Za-z0-9_-]{6,20})"/g)].map((m) => m[1]))];
if (!ids.length) {
  console.error("No se encontraron fotos en", registry);
  process.exit(1);
}

let manifest = {};
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch {
  manifest = {};
}

await mkdir(outDir, { recursive: true });
const failures = [];

async function exists(file) {
  try {
    return (await stat(file)).size > 0;
  } catch {
    return false;
  }
}

for (const id of ids) {
  const file = path.join(outDir, `${id}.jpg`);
  const publicPath = `/images/demo/${id}.jpg`;
  if (!force && (await exists(file)) && manifest[id]) {
    console.log(`✓ ${id} (ya existe)`);
    continue;
  }
  try {
    const res = await fetch(`https://unsplash.com/photos/${id}/download?force=true`, {
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) throw new Error(`HTTP ${res.status} ${type}`);
    const input = Buffer.from(await res.arrayBuffer());
    if (input.length < 20_000) throw new Error("archivo demasiado pequeño");
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    await writeFile(file, data);
    manifest[id] = { file: publicPath, width: info.width, height: info.height };
    console.log(`↓ ${id} ${info.width}×${info.height} (${Math.round(data.length / 1024)} KB)`);
  } catch (error) {
    delete manifest[id];
    failures.push(id);
    console.warn(`✗ ${id}: ${error instanceof Error ? error.message : error}`);
  }
}

// Solo se conservan entradas de fotos que siguen en el registro.
const cleaned = Object.fromEntries(Object.entries(manifest).filter(([id]) => ids.includes(id)).sort());
await writeFile(manifestPath, JSON.stringify(cleaned, null, 2) + "\n");

console.log(`\n${ids.length - failures.length}/${ids.length} fotos disponibles. Manifiesto: ${path.relative(root, manifestPath)}`);
if (failures.length) {
  console.warn("Fotos no descargadas (se mostrará un placeholder):", failures.join(", "));
  if (strict) process.exit(1);
}
