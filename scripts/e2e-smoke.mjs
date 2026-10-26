#!/usr/bin/env node
/**
 * Recorridos principales en navegador real (Playwright/Chromium).
 * Requiere la tienda en ejecución: npm run build && npm start -- -p 3100
 * Uso: BASE_URL=http://localhost:3100 npm run test:e2e
 */
import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const results = [];
const consoleErrors = [];

async function step(name, fn) {
  try {
    await fn();
    results.push(["✓", name]);
  } catch (error) {
    results.push(["✗", `${name}: ${error.message.split("\n")[0]}`]);
  }
}

const browser = await chromium.launch();

async function newPage(viewport) {
  const context = await browser.newContext({ viewport, locale: "es-CO" });
  const page = await context.newPage();
  page.on("console", (m) => {
    // Las fotos no descargadas producen 4xx esperados; el resto se reporta.
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) consoleErrors.push(m.text().slice(0, 200));
  });
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
  return { context, page };
}

const desktop = await newPage({ width: 1366, height: 900 });
const page = desktop.page;

await step("inicio carga con titular y categorías", async () => {
  const res = await page.goto(BASE + "/");
  assert.equal(res.status(), 200);
  assert.equal(await page.locator("h1").first().innerText(), "Estilo para cada paso.");
  assert.ok((await page.locator('a[href^="/catalogo/"]').count()) >= 6);
});

await step("páginas inexistentes devuelven 404", async () => {
  for (const path of ["/no-existe", "/producto/no-existe", "/catalogo/inventada"]) {
    const res = await page.goto(BASE + path);
    assert.equal(res.status(), 404, path);
    await page.getByRole("heading", { name: "No encontramos esta página" }).waitFor();
  }
});

await step("filtros combinables reflejados en la URL y navegación atrás", async () => {
  await page.goto(BASE + "/catalogo");
  const count = () => page.locator("main ul li article").count();
  const total = await count();
  await page.getByRole("complementary", { name: "Filtros" }).getByLabel(/^Botas/).check();
  await page.waitForURL(/categoria=botas/);
  const botas = await count();
  assert.ok(botas > 0 && botas < total, `botas=${botas} total=${total}`);
  await page.getByRole("complementary", { name: "Filtros" }).getByRole("button", { name: "40", exact: true }).click();
  await page.waitForURL(/talla=40/);
  assert.ok((await count()) <= botas);
  await page.selectOption("#catalogo-orden", "precio-asc");
  await page.waitForURL(/orden=precio-asc/);
  const prices = await page.locator("main ul li article p.tabular-nums span:not(.sr-only)").allInnerTexts();
  const nums = prices.map((p) => Number(p.replace(/\D/g, "")));
  assert.deepEqual(nums, [...nums].sort((a, b) => a - b));
  await page.goBack();
  await page.waitForURL((u) => !u.search.includes("orden="));
  await page.goBack();
  await page.waitForURL((u) => !u.search.includes("talla="));
});

await step("búsqueda sin resultados muestra estado vacío y se puede limpiar", async () => {
  await page.goto(BASE + "/catalogo?q=zzzzzz");
  await page.getByRole("heading", { name: "No encontramos productos" }).waitFor();
  await page.getByRole("button", { name: "Limpiar filtros" }).last().click();
  await page.waitForURL((u) => !u.search.includes("q="));
});

await step("ficha: exige talla, bloquea tallas agotadas y agrega al carrito", async () => {
  await page.goto(BASE + "/producto/bota-andina-cafe");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.getByText("Selecciona una talla para continuar.").waitFor();
  const disabled = await page.locator('input[name="talla"]:disabled').count();
  assert.ok(disabled >= 1, "debería haber al menos una talla agotada en el demo");
  await page.locator('input[name="talla"]:not(:disabled)').first().check({ force: true });
  await page.getByRole("button", { name: "Aumentar cantidad" }).click();
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.getByText(/agregado al carrito|Agregamos/).waitFor();
  await page.getByRole("link", { name: /Carrito, 2 artículos/ }).waitFor();
});

await step("producto agotado no se puede agregar", async () => {
  await page.goto(BASE + "/producto/tenis-nocturno-dorado-azul");
  assert.equal(await page.getByRole("button", { name: "Agotado" }).isDisabled(), true);
});

await step("carrito persiste tras recargar y recalcula en servidor", async () => {
  await page.goto(BASE + "/carrito");
  await page.reload();
  await page.getByRole("heading", { name: "Bota Andina" }).waitFor();
  const subtotal = page.locator("dl div").first().locator("dd");
  await page.waitForFunction(() => /\$/.test(document.querySelector("aside dl div dd")?.textContent ?? ""));
  assert.match((await subtotal.innerText()).replace(/ /g, " "), /\$ 979\.800/);
});

await step("datos manipulados en localStorage se corrigen con el servidor", async () => {
  await page.evaluate(() => {
    const key = "tienda-calzado:cart:v1";
    const cart = JSON.parse(localStorage.getItem(key));
    cart.items[0].snapshot.unitPrice = 1000;
    cart.items.push({ ...cart.items[0], sku: "FALSO-123", quantity: 1 });
    localStorage.setItem(key, JSON.stringify(cart));
  });
  await page.reload();
  await page.getByText("Actualizamos tu carrito").waitFor();
  await page.waitForFunction(() => /979\.800/.test(document.querySelector("aside dl")?.textContent ?? ""));
  assert.equal(await page.getByRole("heading", { level: 2, name: /Bota Andina/ }).count(), 1);
});

await step("checkout: errores claros y modo demo sin crear pedido", async () => {
  await page.goto(BASE + "/checkout");
  await page.getByRole("button", { name: /Validar pedido|Ir a pagar/ }).click();
  await page.getByText("Ingresa tu nombre.").waitFor();
  await page.getByText("Selecciona un departamento.").waitFor();
  await page.getByLabel("Nombre", { exact: true }).fill("Ana");
  await page.getByLabel("Apellido").fill("Pérez");
  await page.getByLabel("Correo electrónico").fill("ana@correo.com");
  await page.getByLabel("Celular").fill("300 123 4567");
  await page.getByLabel("Departamento").selectOption("Bogotá D. C.");
  assert.equal(await page.getByLabel("Ciudad o municipio").inputValue(), "Bogotá");
  await page.getByLabel("Dirección", { exact: true }).fill("Calle 72 # 10-34");
  await page.getByLabel(/Acepto los/).check();
  await page.waitForFunction(() => /12\.000/.test(document.querySelector("aside dl")?.textContent ?? ""));
  await page.getByRole("button", { name: /Validar pedido|Ir a pagar/ }).click();
  await page.getByText("Pedido validado (modo demostración)").waitFor();
});

await step("pedido sin token válido no revela información", async () => {
  await page.goto(BASE + "/pedido?referencia=PED-ABCDEFGH23&t=falso");
  await page.getByRole("heading", { name: "No encontramos el pedido" }).waitFor();
});

await step("teclado: enlace para saltar al contenido", async () => {
  await page.goto(BASE + "/");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), "Saltar al contenido");
});

await step("robots y sitemap", async () => {
  const robots = await (await page.request.get(BASE + "/robots.txt")).text();
  assert.match(robots, /Disallow: \//); // demo: no indexable
  const sitemap = await page.request.get(BASE + "/sitemap.xml");
  assert.equal(sitemap.status(), 200);
  assert.doesNotMatch(await sitemap.text(), /\/producto\//); // sin productos demo
});
await desktop.context.close();

const mobile = await newPage({ width: 390, height: 844 });
await step("móvil: menú y panel de filtros accesibles", async () => {
  const m = mobile.page;
  await m.goto(BASE + "/catalogo");
  await m.getByRole("button", { name: "Abrir menú" }).click();
  await m.getByRole("dialog", { name: "Menú" }).getByRole("link", { name: "Sandalias" }).click();
  await m.waitForURL(/\/catalogo\/sandalias/);
  await m.getByRole("button", { name: /^Filtrar/ }).click();
  const dialog = m.getByRole("dialog", { name: "Filtros" });
  await dialog.waitFor();
  await dialog.getByLabel("Mujer").check();
  await m.waitForURL(/genero=mujer/);
  await m.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(overflow, false, "no debe haber scroll horizontal");
});
await mobile.context.close();
await browser.close();

for (const [mark, name] of results) console.log(`${mark} ${name}`);
if (consoleErrors.length) console.log("\nErrores de consola:\n" + [...new Set(consoleErrors)].join("\n"));
const failed = results.filter(([m]) => m === "✗").length;
console.log(`\n${results.length - failed}/${results.length} recorridos correctos`);
process.exit(failed || consoleErrors.length ? 1 : 0);
