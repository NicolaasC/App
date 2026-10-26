# Administración

## Estado
No hay panel administrativo todavía. La base de datos ya está preparada para él:
`admin_users` (roles `admin` / `staff`), función `is_admin()` y políticas RLS que solo permiten escribir el
catálogo y leer pedidos a administradores autenticados (probado).

## Alternativa provisional (sin panel)
- **Catálogo**: Supabase Studio (Table Editor) con un usuario del equipo, o cargas por script como
  `npm run db:seed-demo` adaptado a un CSV del inventario real.
- **Pedidos**: vistas guardadas en Supabase Studio filtrando `orders` por `status` y `needs_review`.
- Riesgo: Studio da acceso total; limitar a una o dos personas con 2FA.

## Plan del panel (cuando se apruebe)
1. Supabase Auth (correo + enlace mágico o contraseña con 2FA) solo para el equipo; alta manual en `admin_users`.
2. Rutas `/admin/*` en Next.js con verificación de sesión **en cada Server Action y página** (no solo en proxy).
3. Funciones: productos (crear/editar/publicar), categorías, imágenes (Supabase Storage), colores/tallas,
   ajustes de inventario (con `inventory_movements`), pedidos y transiciones permitidas
   (`paid → preparing → shipped → delivered`), cola de incidencias (`needs_review`).
4. Registro de auditoría de acciones administrativas (`created_by` en movimientos; tabla de auditoría).
5. Pruebas de autorización: usuario sin rol no puede leer ni modificar nada.
