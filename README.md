# Tienda de calzado — Colombia

Tienda online de calzado para el mercado colombiano (Bogotá D. C. como mercado principal), en español de
Colombia y pesos colombianos. Preparada para desplegarse en Vercel con Supabase (PostgreSQL) y Wompi.

> **Estado: demostración.** Marca, productos, precios, existencias, tarifas de envío y textos legales son
> provisionales. Ver [`docs/estado.md`](docs/estado.md) para lo completado, lo pendiente y las decisiones que faltan.

## Requisitos

- Node.js 22 LTS y npm 10+ (si `npm install <paquete>` falla con `edgesOut`, usar `npx npm@11 i <paquete>`).
- Opcional: PostgreSQL 15+ local para pruebas de integración; cuenta de Supabase y de Wompi para pedidos reales.

## Puesta en marcha

```bash
npm ci
cp .env.example .env.local      # valores por defecto = modo demostración
npm run images:fetch            # descarga las fotos demo de Unsplash (requiere internet)
npm run dev                     # http://localhost:3000
```

Sin `images:fetch` la tienda funciona igual y muestra placeholders.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` / `build` / `start` | Desarrollo, build de producción, servidor de producción |
| `npm run typecheck` | Genera tipos de rutas y ejecuta `tsc --noEmit` |
| `npm run lint` | ESLint (config de Next.js) |
| `npm test` | Vitest: unitarias siempre; integración si `TEST_DATABASE_URL` está definida |
| `npm run test:e2e` | Recorridos en Chromium contra `BASE_URL` (por defecto `http://localhost:3100`) |
| `npm run images:fetch` | Descarga y optimiza las fotos de demostración |
| `npm run db:seed-demo` | Carga el catálogo demo en `DATABASE_URL` |

## Arquitectura

```
src/
  app/                 rutas (App Router), Server Actions (actions/), webhooks y cron (api/)
  components/          ui/ layout/ home/ catalog/ product/ cart/ checkout/
  config/              site.ts (identidad, textos, contacto) · shipping.ts (logística)
  content/             páginas informativas y legales (borradores)
  data/demo/           catálogo y registro de fotos de demostración
  lib/                 lógica pura compartida: filtros, variantes, carrito, validación, formato
  server/              solo servidor: catálogo, cotización, pedidos, pagos, env, límites
  proxy.ts             404 reales para productos/categorías inexistentes
supabase/migrations/   esquema SQL versionado (RLS incluida)
tests/                 unit/ e integration/ (Vitest) · scripts/e2e-smoke.mjs (Playwright)
docs/                  estado, modelo de datos, pagos, despliegue, imágenes, seguridad y legal
```

Principios: el navegador nunca decide precios, existencias ni totales; un pedido solo se marca pagado por un
evento de Wompi con firma verificada; los datos provisionales se configuran en `src/config/` y no se inventan.

## Documentación

- [Estado y pendientes](docs/estado.md)
- [Modelo de datos y seguridad de la base](docs/modelo-de-datos.md)
- [Pagos con Wompi](docs/pagos.md)
- [Despliegue en Vercel](docs/despliegue.md)
- [Imágenes y licencias](docs/imagenes.md)
- [Seguridad, privacidad y requisitos legales](docs/seguridad-y-legal.md)
- [Administración](docs/administracion.md)
- [Resultados de pruebas](docs/pruebas.md)
- Convenciones para Claude Code: [`CLAUDE.md`](CLAUDE.md)
