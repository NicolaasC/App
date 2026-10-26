@AGENTS.md

# Tienda de calzado (Colombia) — convenciones del proyecto

Tienda online de calzado para Colombia (mercado principal Bogotá D. C.), en español de Colombia y COP.
Despliegue objetivo: Vercel. Estado y pendientes: `docs/estado.md`.

## Stack
- Next.js 16.4 (App Router, **Cache Components y Partial Prefetching activados**), React 19, TypeScript estricto.
- Tailwind CSS 4 (tokens en `src/app/globals.css` → `@theme`). Iconos: `lucide-react`. Validación: `zod` 4.
- Pruebas: Vitest (`npm test`), recorridos de navegador con Playwright preinstalado (`npm run test:e2e`).
- npm 10 del entorno falla al instalar algunos paquetes (`edgesOut`); usa `npx npm@11 i <paquete>`.

## Reglas de Next 16 que importan aquí
- Leer `node_modules/next/dist/docs/` antes de usar APIs nuevas.
- `searchParams`, `cookies()`, `headers()` y `useSearchParams()` deben quedar dentro de `<Suspense>`.
- `generateStaticParams` debe devolver al menos un elemento.
- `images.qualities` es obligatorio; solo se permiten 70 y 85.
- Tipos de rutas (`PageProps<"/ruta">`) se generan con `npx next typegen`.

## Arquitectura (dónde va cada cosa)
- `src/config/` — identidad comercial (`site.ts`), envíos (`shipping.ts`). Todo lo provisional se edita aquí.
- `src/data/demo/` — catálogo y registro de fotos de DEMOSTRACIÓN. Las imágenes se referencian solo desde aquí.
- `src/lib/` — lógica pura compartida cliente/servidor (filtros, variantes, carrito, validación, formato).
- `src/server/` — solo servidor (`import "server-only"`): repositorios, cotización, pagos, pedidos, env.
- `src/app/actions/` — Server Actions (validan con zod y recalculan todo en servidor).
- `src/components/ui|layout|home|catalog|product|cart|checkout` — componentes por dominio.
- `supabase/migrations/` — esquema SQL versionado. `docs/` — documentación funcional y técnica.

## Reglas de negocio no negociables
- No inventar datos comerciales: contacto, NIT, políticas, tiempos de entrega, beneficios, reseñas, descuentos.
  Lo que no exista va como `null`/`enabled: false` y no se muestra.
- Datos de demostración siempre marcados (`isDemo`, avisos en UI). Sitio no indexable mientras sea demo.
- Precio, existencias, descuentos, envío y total se calculan en el servidor (`src/server/pricing/quote.ts`).
  El carrito en `localStorage` solo guarda SKU, cantidad y una copia de presentación.
- Variantes = producto + color + talla; existencias por variante. Nunca permitir más que el stock ni más de 10 por línea.
- Un pedido nunca se marca pagado por visitar una URL: solo por evento del proveedor con firma verificada.
- Estados de pedido y de pago separados. Eventos de pago idempotentes.
- Secretos solo en variables de entorno de servidor (`src/server/env.ts`). Nunca `NEXT_PUBLIC_` para secretos.
- No usar el dataset de Unsplash (sus términos solo permiten entrenamiento interno de modelos).

## Diseño
- Minimalista editorial: marfil/blanco dominan, negro carbón para texto y acciones, salvia y arena como acentos.
- Tipografías: Instrument Sans (funcional) e Instrument Serif (titulares). Radios 2–4 px, sin sombras salvo toasts.
- Texto pequeño gris: usar `text-muted` (#66655A, AA). `text-stone` (#77766A) solo para decoración o texto grande.
- Cada control interactivo debe tener función real, foco visible y estados hover/active/disabled.
- Respetar `prefers-reduced-motion` (ya global en `globals.css`).

## Comandos
- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run test:e2e`
- Fotos demo: elegirlas con el conector de Unsplash (verificar `premium: false`), registrar uso con `download_asset`,
  enlazar desde images.unsplash.com y mostrar el crédito (`PhotoCredit`).
- Antes de dar algo por terminado: typecheck, lint, test y build deben pasar.
