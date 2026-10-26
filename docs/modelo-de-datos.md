# Modelo de datos

Esquema en `supabase/migrations/20261026000100_initial_schema.sql` (PostgreSQL 15+, probado en 16 local).

## Tablas

| Tabla | Propósito | Claves y restricciones relevantes |
| --- | --- | --- |
| `categories` | Categorías de navegación | PK `slug` (formato validado) |
| `products` | Producto comercial | `code` y `slug` únicos; `price_cop ≥ 0`; `compare_at_price_cop > price_cop` si existe; publicado ⇒ `published_at` |
| `product_colors` | Colores por producto | único `(product_id, color_key)` |
| `product_images` | Fotos (ruta propia, alt obligatorio, crédito, `provisional`) | FK a color opcional |
| `product_materials` | Materiales con bandera `verified` | — |
| `variants` | Producto + color + talla con existencias | `sku` único; único `(product_id, color_id, size)`; `stock ≥ 0` |
| `inventory_movements` | Auditoría de cambios de stock | `reason` ∈ reserva, liberación, ajuste, reposición, devolución |
| `orders` | Pedido | `reference` y `idempotency_key` únicos; `total = subtotal − descuento + envío`; `access_token_hash` (64 hex) |
| `order_items` | Líneas con precio congelado | `line_total = unit × qty`; `quantity` 1–10 |
| `payments` | Intentos de pago (proveedor) | `provider_reference` y `provider_transaction_id` únicos |
| `payment_events` | Eventos recibidos (idempotencia) | único `(provider, event_key)` |
| `newsletter_subscriptions` | Suscripción con texto y versión del consentimiento | `email` único en minúsculas |
| `admin_users` | Roles de administración | FK a `auth.users` |

Todas las tablas tienen `created_at`; las mutables tienen `updated_at` mantenido por trigger.

## Estados

- Pedido (`orders.status`): `pending_payment` → `paid` → `preparing` → `shipped` → `delivered`; además
  `payment_failed`, `cancelled`, `refunded`.
- Pago (`payments.status`): `pending` → `approved | declined | voided | error`. Reglas en `src/server/orders/state.ts`.
- `needs_review` + `review_reason` marcan incidencias (monto distinto, pago aprobado sobre pedido vencido, reverso).

## Flujo transaccional (src/server/orders/postgres-repository.ts)

1. **Crear pedido**: bloquea las variantes (`FOR UPDATE`, orden determinista), valida publicación, existencias y
   precio vigente, descuenta stock, registra movimientos, crea pedido, líneas y pago `pending`. Todo o nada.
   Un segundo envío con la misma `idempotency_key` devuelve el mismo pedido (también en envíos simultáneos).
2. **Evento de pago**: inserta el evento (`ON CONFLICT DO NOTHING` → duplicado), bloquea pago y pedido,
   verifica monto y moneda, aplica la transición permitida y su efecto (pagado, fallido + liberar stock, etc.).
3. **Vencimiento**: `/api/cron/expirar-pedidos` cancela pedidos `pending_payment` vencidos y libera stock.

## Seguridad a nivel de filas

- El servidor usa `DATABASE_URL` (rol privilegiado); los roles públicos de Supabase (`anon`, `authenticated`)
  pasan por RLS.
- Público: lectura de categorías y de productos **publicados** (y sus colores, imágenes, materiales, variantes).
- Escritura de catálogo: solo `is_admin()` (usuario autenticado presente en `admin_users`).
- Pedidos, pagos, eventos, movimientos y suscripciones: sin acceso público; lectura solo para administradores.
- Verificado con pruebas: `anon` no puede cambiar precios ni stock, no ve pedidos ni borradores, no puede
  auto-asignarse rol de administrador (`tests/integration/orders.test.ts`).

## Migraciones

- Nuevas migraciones: `supabase/migrations/AAAAMMDDHHMMSS_descripcion.sql`, nunca editar una ya aplicada.
- Aplicar en Supabase: `supabase link --project-ref <ref>` y `supabase db push` (CLI de Supabase), o el editor SQL.
- Probar localmente: `supabase/tests/bootstrap-local.sql` simula `auth` y roles; las pruebas de integración
  crean una base desechable y aplican todas las migraciones en orden.
- Datos demo: `DATABASE_URL=… npm run db:seed-demo` (no usar en una base con pedidos reales).
