-- soy ese · esquema de Supabase
-- Ejecutar una sola vez en Supabase → SQL Editor → New query → Run.
-- Después ejecutar supabase/datos-privados.sql (no está en el repositorio).

-- Todo el catálogo (textos, categorías, productos, pagos) vive en un único documento JSON.
create table if not exists public.store (
  id int primary key check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Emails autorizados a editar el catálogo.
create table if not exists public.admins (
  email text primary key
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

alter table public.store enable row level security;
alter table public.admins enable row level security;

drop policy if exists "catalogo publico" on public.store;
create policy "catalogo publico" on public.store for select using (true);

drop policy if exists "solo admin edita" on public.store;
create policy "solo admin edita" on public.store for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- admins no tiene políticas: nadie la lee ni la modifica desde la web.

-- Fotos de productos: lectura pública, subida solo para admins.
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists "admin sube fotos" on storage.objects;
create policy "admin sube fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and public.is_admin());

-- Catálogo inicial: categorías de ejemplo y productos en borrador (no se muestran hasta publicarlos).
insert into public.store (id, data) values (1, $json$
{
  "settings": {
    "name": "soy ese",
    "headline": "Tu lado más",
    "accent": "michi.",
    "description": "Ropa, accesorios y pequeñas alegrías para quienes llevamos un gato en el corazón.",
    "currency": "USD",
    "whatsapp": "",
    "paymentMethods": [],
    "delivery": {"name": "Yummy", "enabled": true, "details": "Cobertura y costo de entrega a coordinar."}
  },
  "categories": [
    {"id": "tees", "name": "Franelas / remeras", "fields": [
      {"id": "size", "name": "Talles", "type": "list", "required": true},
      {"id": "material", "name": "Material", "type": "text", "required": false}]},
    {"id": "caps", "name": "Gorras", "fields": [
      {"id": "color", "name": "Color", "type": "select", "options": ["Rosa", "Negro", "Blanco"], "required": true},
      {"id": "fit", "name": "Ajuste", "type": "text", "required": false}]},
    {"id": "figures", "name": "Figuritas", "fields": [
      {"id": "height", "name": "Altura (cm)", "type": "number", "required": false},
      {"id": "material", "name": "Material", "type": "text", "required": false}]}
  ],
  "products": [
    {"id": "p1", "name": "Franela Bigotes", "category": "tees", "description": "Franela de algodón con estampado de gatito, corte relajado.", "price": 22, "status": "draft", "available": true, "photo": "tshirt", "image": "", "values": {"size": "S, M, L, XL", "material": "100% algodón"}},
    {"id": "p2", "name": "Gorra Michi Club", "category": "caps", "description": "Gorra cómoda con un pequeño gato bordado.", "price": 16, "status": "draft", "available": true, "photo": "cap", "image": "", "values": {"color": "Rosa", "fit": "Regulable"}},
    {"id": "p3", "name": "Dúo de gatitos", "category": "figures", "description": "Set de dos figuritas decorativas.", "price": 12, "status": "draft", "available": true, "photo": "figure", "image": "", "values": {"height": "9", "material": "Cerámica"}}
  ]
}
$json$::jsonb)
on conflict (id) do nothing;
