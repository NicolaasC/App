-- =============================================================================
-- Esquema inicial de la tienda (Supabase / PostgreSQL 15+)
--
-- Modelo de acceso:
--  * El servidor Next.js se conecta con DATABASE_URL (rol privilegiado) y
--    ejecuta todas las operaciones sensibles (precios, existencias, pedidos,
--    pagos) dentro de transacciones.
--  * Los roles públicos de Supabase (anon, authenticated) solo pueden LEER el
--    catálogo publicado. RLS bloquea cualquier escritura que no sea de un
--    administrador autenticado (tabla admin_users).
--
-- Documentación: docs/modelo-de-datos.md
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Administración
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Usuarios con acceso al panel. Se asignan manualmente (SQL) por un administrador.';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------
create table public.categories (
  slug            text primary key check (slug ~ '^[a-z0-9-]{1,40}$'),
  name            text not null check (length(name) between 1 and 60),
  description     text not null default '',
  position        integer not null default 0,
  show_when_empty boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.products (
  id                   uuid primary key default gen_random_uuid(),
  code                 text not null unique check (code ~ '^[A-Z0-9-]{2,20}$'),
  slug                 text not null unique check (slug ~ '^[a-z0-9-]{1,120}$'),
  name                 text not null check (length(name) between 1 and 120),
  short_description    text not null default '',
  description          text not null default '',
  category_slug        text not null references public.categories (slug) on update cascade,
  gender               text not null check (gender in ('mujer', 'hombre', 'unisex')),
  price_cop            integer not null check (price_cop >= 0),
  compare_at_price_cop integer check (compare_at_price_cop is null or compare_at_price_cop > price_cop),
  status               text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured             boolean not null default false,
  is_new               boolean not null default false,
  rank                 integer not null default 0,
  collections          text[] not null default '{}',
  is_demo              boolean not null default false,
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint published_requires_date check (status <> 'published' or published_at is not null)
);

create index products_category_idx on public.products (category_slug) where status = 'published';
create index products_published_at_idx on public.products (published_at desc) where status = 'published';
create index products_collections_idx on public.products using gin (collections);

create table public.product_colors (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_key  text not null check (color_key ~ '^[a-z0-9-]{1,30}$'),
  name       text not null,
  swatch     text not null,
  position   integer not null default 0,
  unique (product_id, color_key)
);

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  color_id    uuid references public.product_colors (id) on delete set null,
  -- Ruta en Supabase Storage o en /public; nunca URLs de terceros sin licencia verificada.
  src         text not null,
  alt         text not null check (length(alt) between 1 and 200),
  width       integer check (width > 0),
  height      integer check (height > 0),
  focal       text,
  position    integer not null default 0,
  provisional boolean not null default false,
  credit      jsonb,
  created_at  timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, position);

create table public.product_materials (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label      text not null,
  verified   boolean not null default false,
  position   integer not null default 0
);

create table public.variants (
  id         uuid primary key default gen_random_uuid(),
  sku        text not null unique check (sku ~ '^[A-Z0-9-]{3,64}$'),
  product_id uuid not null references public.products (id) on delete cascade,
  color_id   uuid not null references public.product_colors (id) on delete cascade,
  size       numeric(4, 1) not null check (size between 15 and 55),
  stock      integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, color_id, size)
);

create index variants_product_idx on public.variants (product_id);

-- Historial de cambios de existencias (auditoría).
create table public.inventory_movements (
  id         bigint generated always as identity primary key,
  variant_id uuid not null references public.variants (id) on delete cascade,
  delta      integer not null check (delta <> 0),
  reason     text not null check (reason in ('order_reserved', 'order_released', 'manual_adjustment', 'restock', 'return')),
  order_id   uuid,
  note       text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index inventory_movements_variant_idx on public.inventory_movements (variant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Pedidos y pagos
-- ---------------------------------------------------------------------------
create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  reference         text not null unique check (reference ~ '^PED-[A-Z0-9]{8,16}$'),
  status            text not null default 'pending_payment' check (status in (
                      'pending_payment', 'paid', 'payment_failed', 'cancelled',
                      'preparing', 'shipped', 'delivered', 'refunded')),
  idempotency_key   uuid not null unique,
  access_token_hash text not null check (length(access_token_hash) = 64),
  customer_email    text not null,
  customer_name     text not null,
  customer_phone    text not null,
  shipping_address  jsonb not null,
  shipping_method   text not null,
  shipping_zone     text not null,
  subtotal_cop      integer not null check (subtotal_cop >= 0),
  discount_cop      integer not null default 0 check (discount_cop >= 0),
  shipping_cop      integer not null check (shipping_cop >= 0),
  total_cop         integer not null check (total_cop >= 0),
  currency          text not null default 'COP' check (currency = 'COP'),
  is_demo           boolean not null default false,
  needs_review      boolean not null default false,
  review_reason     text,
  expires_at        timestamptz not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint total_matches check (total_cop = subtotal_cop - discount_cop + shipping_cop)
);

create index orders_status_idx on public.orders (status, created_at desc);
create index orders_email_idx on public.orders (lower(customer_email));
create index orders_review_idx on public.orders (created_at desc) where needs_review;

create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  variant_id     uuid not null references public.variants (id) on delete restrict,
  sku            text not null,
  product_name   text not null,
  color_name     text not null,
  size           numeric(4, 1) not null,
  unit_price_cop integer not null check (unit_price_cop >= 0),
  quantity       integer not null check (quantity between 1 and 10),
  line_total_cop integer not null,
  constraint line_total_matches check (line_total_cop = unit_price_cop * quantity),
  unique (order_id, variant_id)
);

create table public.payments (
  id                      uuid primary key default gen_random_uuid(),
  order_id                uuid not null references public.orders (id) on delete restrict,
  provider                text not null check (provider in ('wompi')),
  -- Referencia que enviamos al proveedor (única por intento de pago).
  provider_reference      text not null unique,
  provider_transaction_id text unique,
  status                  text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'voided', 'error')),
  amount_cop              integer not null check (amount_cop >= 0),
  currency                text not null default 'COP',
  status_detail           text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id);

-- Registro idempotente de eventos recibidos del proveedor.
create table public.payment_events (
  id           bigint generated always as identity primary key,
  provider     text not null,
  event_key    text not null,
  event_type   text not null,
  payload      jsonb not null,
  result       text,
  received_at  timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, event_key)
);

-- ---------------------------------------------------------------------------
-- Boletín
-- ---------------------------------------------------------------------------
create table public.newsletter_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  email           text not null check (email = lower(email) and position('@' in email) > 1),
  consent_text    text not null,
  consent_version text not null,
  consented_at    timestamptz not null default now(),
  unsubscribed_at timestamptz,
  source          text not null default 'web',
  created_at      timestamptz not null default now(),
  unique (email)
);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger variants_updated_at before update on public.variants
  for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seguridad a nivel de filas
-- ---------------------------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_images enable row level security;
alter table public.product_materials enable row level security;
alter table public.variants enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.newsletter_subscriptions enable row level security;

-- Lectura pública solo del catálogo publicado.
create policy "categorias visibles" on public.categories
  for select to anon, authenticated using (true);

create policy "productos publicados" on public.products
  for select to anon, authenticated using (status = 'published' or public.is_admin());

create policy "colores de productos publicados" on public.product_colors
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and (p.status = 'published' or public.is_admin())));

create policy "imagenes de productos publicados" on public.product_images
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and (p.status = 'published' or public.is_admin())));

create policy "materiales de productos publicados" on public.product_materials
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and (p.status = 'published' or public.is_admin())));

create policy "variantes de productos publicados" on public.variants
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and (p.status = 'published' or public.is_admin())));

-- Escritura del catálogo: solo administradores.
create policy "admin gestiona categorias" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin gestiona productos" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin gestiona colores" on public.product_colors
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin gestiona imagenes" on public.product_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin gestiona materiales" on public.product_materials
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin gestiona variantes" on public.variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Datos operativos: solo lectura para administradores. Las escrituras las
-- hace el servidor con conexión privilegiada (fuera de RLS).
create policy "admin lee movimientos" on public.inventory_movements
  for select to authenticated using (public.is_admin());
create policy "admin lee pedidos" on public.orders
  for select to authenticated using (public.is_admin());
create policy "admin lee articulos" on public.order_items
  for select to authenticated using (public.is_admin());
create policy "admin lee pagos" on public.payments
  for select to authenticated using (public.is_admin());
create policy "admin lee eventos" on public.payment_events
  for select to authenticated using (public.is_admin());
create policy "admin lee suscripciones" on public.newsletter_subscriptions
  for select to authenticated using (public.is_admin());
create policy "admin se ve a si mismo" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- Sin políticas de INSERT/UPDATE/DELETE para anon: cualquier intento se rechaza.
