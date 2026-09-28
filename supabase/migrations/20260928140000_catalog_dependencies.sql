-- Catalog dependency used by the product management migration and storefront.
-- Keep this migration before 20260928143000_product_management.sql.

create table if not exists public.marcas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  logo_url text,
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

create index if not exists marcas_ativo_ordem_idx
  on public.marcas (ativo, ordem);

alter table public.marcas enable row level security;

drop policy if exists "marcas_public_select" on public.marcas;
create policy "marcas_public_select"
on public.marcas
for select
to anon, authenticated
using (ativo = true);

drop policy if exists "marcas_admin_insert" on public.marcas;
drop policy if exists "marcas_admin_update" on public.marcas;
drop policy if exists "marcas_admin_delete" on public.marcas;

create policy "marcas_admin_insert"
on public.marcas
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "marcas_admin_update"
on public.marcas
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "marcas_admin_delete"
on public.marcas
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

insert into public.marcas (nome, ordem)
values
  ('Apple', 10),
  ('Samsung', 20),
  ('Xiaomi', 30),
  ('Realme', 40),
  ('DJI', 50),
  ('Starlink', 60),
  ('Outros', 100)
on conflict (nome) do nothing;
