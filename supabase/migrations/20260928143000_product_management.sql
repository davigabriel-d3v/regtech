create extension if not exists pgcrypto;

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.product_categories (name) values
  ('Celulares'), ('Informática'), ('Acessórios'), ('Eletrônicos'),
  ('Motos Elétricas'), ('Starlink'), ('Serviços'), ('Outros')
on conflict (name) do nothing;

create table if not exists public.product_code_registry (
  product_code text primary key,
  reserved_at timestamptz not null default now()
);

create or replace function public.generate_product_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := 'PROD-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      insert into public.product_code_registry(product_code) values (candidate);
      return candidate;
    exception when unique_violation then
      null;
    end;
  end loop;
end;
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null default public.generate_product_code(),
  name text not null,
  description text,
  category_id uuid references public.product_categories(id) on delete set null,
  brand_id uuid references public.marcas(id) on delete set null,
  price numeric(14,2) not null check (price >= 0),
  promotional_price numeric(14,2) check (promotional_price is null or (promotional_price >= 0 and promotional_price <= price)),
  stock integer not null default 0 check (stock >= 0),
  minimum_stock integer not null default 0 check (minimum_stock >= 0),
  sku text,
  barcode text,
  notes text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_product_code_unique unique (product_code)
);

insert into public.product_code_registry(product_code)
select product_code from public.products
on conflict do nothing;

create or replace function public.lock_product_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.product_code is distinct from new.product_code then
    raise exception 'product_code cannot be changed';
  end if;

  if tg_op = 'INSERT' then
    insert into public.product_code_registry(product_code) values (new.product_code)
    on conflict do nothing;
    if not exists (
      select 1 from public.product_code_registry r
      where r.product_code = new.product_code
    ) then
      raise exception 'Unable to reserve product_code';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_product_code_guard on public.products;
create trigger products_product_code_guard
before insert or update of product_code on public.products
for each row execute function public.lock_product_code();

create unique index if not exists products_sku_unique
  on public.products (lower(sku))
  where sku is not null and btrim(sku) <> '';

create index if not exists products_name_idx on public.products (lower(name));
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_status_idx on public.products (status);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  image_url text not null,
  is_primary boolean not null default false,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_idx on public.product_images(product_id, display_order);
create unique index if not exists product_images_one_primary
  on public.product_images(product_id)
  where is_primary;

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
before update on public.products
for each row execute function public.set_products_updated_at();

alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_categories enable row level security;

drop policy if exists "products_admin_select" on public.products;
drop policy if exists "products_admin_insert" on public.products;
drop policy if exists "products_admin_update" on public.products;
drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_select" on public.products for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "products_admin_insert" on public.products for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "products_admin_update" on public.products for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "products_admin_delete" on public.products for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "product_images_admin_select" on public.product_images;
drop policy if exists "product_images_admin_insert" on public.product_images;
drop policy if exists "product_images_admin_update" on public.product_images;
drop policy if exists "product_images_admin_delete" on public.product_images;
create policy "product_images_admin_select" on public.product_images for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "product_images_admin_insert" on public.product_images for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "product_images_admin_update" on public.product_images for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "product_images_admin_delete" on public.product_images for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "product_categories_admin_select" on public.product_categories;
create policy "product_categories_admin_select" on public.product_categories for select to authenticated using (public.has_role(auth.uid(), 'admin'));

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "product images public read" on storage.objects;
drop policy if exists "product images admin insert" on storage.objects;
drop policy if exists "product images admin update" on storage.objects;
drop policy if exists "product images admin delete" on storage.objects;
create policy "product images public read"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "product images admin insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));

create policy "product images admin update"
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'))
with check (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));

create policy "product images admin delete"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'admin'));
