# Pruebas

Resultados de la última ejecución real (26-oct-2026, entorno de desarrollo en la nube, Node 22.22,
PostgreSQL 16.15 local, Chromium 1243 de Playwright).

## Comprobaciones estáticas y build

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `npm run lint` | Sin errores ni advertencias |
| `npm run build` | Correcto (50 páginas generadas; rutas dinámicas con Partial Prerendering) |

## Vitest

- Sin base de datos: **46 pasan, 20 omitidas** (integración).
- Con `TEST_DATABASE_URL` (PostgreSQL 16 local): **66 de 66 pasan**.

Cobertura funcional: formato COP; filtros combinados, URL simétrica y valores inválidos; selección de
variantes y límites de cantidad; operaciones y subtotales del carrito; persistencia (recarga, datos corruptos,
`localStorage` bloqueado); cálculo del total en servidor (precios manipulados, stock insuficiente, SKUs
inexistentes o despublicados, envío por zona y envío gratis); validación del checkout (errores en español,
teléfonos, cantidades manipuladas); firma de Wompi (integridad y eventos, alteraciones, secreto vacío,
cabecera, antigüedad); transiciones de estado; tokens de acceso; pedidos transaccionales (reserva, rechazo,
idempotencia secuencial y simultánea, competencia por la última unidad); eventos de pago (duplicados, fuera de
orden, monto distinto, rechazo con liberación de stock, vencimiento y pago tardío); restricciones SQL; RLS para
`anon`/`authenticated`/administrador; flujo checkout → webhook → pagado; webhook con base de datos caída (500);
cron sin autorización.

Un fallo detectado y corregido gracias a las pruebas: el carrito se rompía si `localStorage.getItem` lanzaba
error (modo privado de algunos navegadores).

## Recorridos en navegador (`npm run test:e2e`)

**13 de 13** correctos, dos ejecuciones consecutivas, sin errores de consola: inicio; 404 reales
(`/no-existe`, producto y categoría inexistentes); filtros combinados con URL y botón atrás; búsqueda sin
resultados; ficha (talla obligatoria, tallas agotadas bloqueadas, cantidad); producto agotado; carrito
persistente tras recarga con total del servidor; corrección de un carrito manipulado en `localStorage`;
checkout con errores y modo demo; pedido sin token; enlace "saltar al contenido"; robots/sitemap; menú y
filtros en móvil sin scroll horizontal.

Además se verificó manualmente con Playwright el flujo con base de datos y Wompi **sandbox simulado** (llaves
ficticias, redirección interceptada porque no hay cuenta ni red hacia Wompi): pedido creado con total
507.900 COP, firma de integridad, webhook falsificado → 401, webhook válido → pedido "Pagado", token incorrecto →
sin información.

## Lighthouse 12 (servidor de producción local, sin fotos descargadas)

| Página | Móvil (Perf / A11y / BP / SEO) | Escritorio |
| --- | --- | --- |
| `/` | 98 / 100 / 100 / 63 | 100 / 100 / 100 / 63 |
| `/catalogo` | 95 / 100 / 100 / 66 | 100 / 100 / 100 / 66 |
| `/producto/bota-andina-cafe` | 97 / 100 / 100 / 66 | 100 / 100 / 100 / 66 |
| `/carrito` | 98 / 100 / 100 / 63 | 100 / 100 / 100 / 63 |

- SEO bajo **a propósito**: el sitio de demostración envía `noindex` y `robots.txt` bloquea todo.
- Las cifras de rendimiento no incluyen el peso de las fotos (no se pudieron descargar) ni la latencia real de
  Vercel: repetir la medición en el Preview con imágenes.
- CLS en `/carrito` 0,07 móvil / 0,05 escritorio (cambio de "cargando" al contenido); dentro del umbral "bueno".

## Cómo reproducir

```bash
npm run typecheck && npm run lint && npm test
TEST_DATABASE_URL=postgres://postgres@localhost:5432/postgres npm test   # PostgreSQL desechable
npm run build && npm start -- -p 3100 &  BASE_URL=http://localhost:3100 npm run test:e2e
```
