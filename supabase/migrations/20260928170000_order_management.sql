create extension if not exists pgcrypto;

alter table public.products
  add column if not exists variations jsonb not null default '{}'::jsonb;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 120),
  phone text not null,
  phone_normalized text not null,
  whatsapp text,
  email text,
  email_normalized text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customers_phone_normalized_unique on public.customers(phone_normalized);
create unique index if not exists customers_email_normalized_unique on public.customers(email_normalized)
  where email_normalized is not null;
create index if not exists customers_name_idx on public.customers(lower(name));

create sequence if not exists public.orders_order_number_seq;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint not null default nextval('public.orders_order_number_seq') unique,
  customer_id uuid not null references public.customers(id),
  status text not null default 'new' check (status in ('new','review','in_progress','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_idx on public.orders(customer_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_order_number_idx on public.orders(order_number);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_code text not null,
  product_name text not null,
  product_image text,
  product_sku text,
  quantity integer not null check (quantity > 0),
  selected_variation jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists order_items_product_idx on public.order_items(product_id);
create index if not exists order_items_product_code_idx on public.order_items(product_code);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status text,
  new_status text not null check (new_status in ('new','review','in_progress','completed','cancelled')),
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx on public.order_status_history(order_id, created_at desc);

create or replace function public.set_customers_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customers_updated_at on public.customers;
create trigger customers_updated_at before update on public.customers
for each row execute function public.set_customers_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
for each row execute function public.set_orders_updated_at();

create or replace function public.record_order_status_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history(order_id, old_status, new_status, changed_by)
    values (new.id, null, new.status, auth.uid());
  elsif old.status is distinct from new.status then
    insert into public.order_status_history(order_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists orders_status_history on public.orders;
create trigger orders_status_history
after insert or update of status on public.orders
for each row execute function public.record_order_status_history();

create or replace function public.create_public_order(
  p_product_id uuid,
  p_quantity integer,
  p_customer jsonb,
  p_notes text default null,
  p_selected_variation jsonb default null
)
returns table(order_id uuid, order_number bigint, order_number_display text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_image text;
  v_customer_id uuid;
  v_phone text;
  v_email text;
  v_name text;
  v_order_id uuid;
  v_order_number bigint;
  v_email_normalized text;
begin
  if p_product_id is null then
    raise exception 'Produto inválido';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 999 then
    raise exception 'Quantidade inválida';
  end if;
  if p_customer is null or jsonb_typeof(p_customer) <> 'object' then
    raise exception 'Dados do cliente inválidos';
  end if;

  v_name := btrim(coalesce(p_customer->>'name', ''));
  v_phone := regexp_replace(coalesce(p_customer->>'phone', ''), '[^0-9+]', '', 'g');
  v_email := lower(btrim(coalesce(p_customer->>'email', '')));
  v_email_normalized := nullif(v_email, '');

  if length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'Nome inválido';
  end if;
  if length(v_phone) < 8 or length(v_phone) > 20 then
    raise exception 'Telefone inválido';
  end if;
  if v_email_normalized is not null and v_email_normalized !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'E-mail inválido';
  end if;

  select * into v_product
  from public.products
  where id = p_product_id and status = 'active'
  for share;

  if not found then
    raise exception 'Produto não disponível';
  end if;

  if v_product.stock < p_quantity then
    raise exception 'Quantidade indisponível em estoque';
  end if;

  select pi.image_url into v_image
  from public.product_images pi
  where pi.product_id = v_product.id
  order by pi.is_primary desc, pi.display_order asc
  limit 1;

  select c.id into v_customer_id
  from public.customers c
  where c.phone_normalized = v_phone
  limit 1;

  if v_customer_id is null and v_email_normalized is not null then
    select c.id into v_customer_id
    from public.customers c
    where c.email_normalized = v_email_normalized
    limit 1;
  end if;

  if v_customer_id is null then
    insert into public.customers(name, phone, phone_normalized, whatsapp, email, email_normalized)
    values (
      v_name,
      btrim(coalesce(p_customer->>'phone', '')),
      v_phone,
      nullif(btrim(coalesce(p_customer->>'whatsapp', '')), ''),
      nullif(btrim(coalesce(p_customer->>'email', '')), ''),
      v_email_normalized
    )
    returning id into v_customer_id;
  else
    update public.customers
    set name = v_name,
        phone = btrim(coalesce(p_customer->>'phone', '')),
        whatsapp = nullif(btrim(coalesce(p_customer->>'whatsapp', '')), ''),
        email = nullif(btrim(coalesce(p_customer->>'email', '')), ''),
        email_normalized = v_email_normalized
    where id = v_customer_id;
  end if;

  insert into public.orders(customer_id, status, notes)
  values (v_customer_id, 'new', nullif(btrim(coalesce(p_notes, '')), ''))
  returning public.orders.id, public.orders.order_number into v_order_id, v_order_number;

  insert into public.order_items(
    order_id, product_id, product_code, product_name, product_image, product_sku,
    quantity, selected_variation
  )
  values (
    v_order_id, v_product.id, v_product.product_code, v_product.name, v_image,
    v_product.sku, p_quantity, p_selected_variation
  );

  return query
  select v_order_id, v_order_number, 'PED-' || lpad(v_order_number::text, 6, '0');
end;
$$;

revoke all on function public.create_public_order(uuid, integer, jsonb, text, jsonb) from public;
grant execute on function public.create_public_order(uuid, integer, jsonb, text, jsonb) to anon, authenticated;

alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

drop policy if exists "customers_admin_select" on public.customers;
drop policy if exists "customers_admin_update" on public.customers;
create policy "customers_admin_select" on public.customers for select to authenticated
using (public.has_role(auth.uid(), 'admin'));
create policy "customers_admin_update" on public.customers for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "orders_admin_select" on public.orders;
drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_select" on public.orders for select to authenticated
using (public.has_role(auth.uid(), 'admin'));
create policy "orders_admin_update" on public.orders for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "order_items_admin_select" on public.order_items;
create policy "order_items_admin_select" on public.order_items for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "order_history_admin_select" on public.order_status_history;
create policy "order_history_admin_select" on public.order_status_history for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

grant select, update on public.customers to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.order_status_history to authenticated;
grant usage, select on sequence public.orders_order_number_seq to authenticated, anon;

drop policy if exists "products_public_select_active" on public.products;
create policy "products_public_select_active" on public.products
for select to anon, authenticated using (status = 'active');

drop policy if exists "product_categories_public_select" on public.product_categories;
create policy "product_categories_public_select" on public.product_categories
for select to anon, authenticated using (true);

drop policy if exists "product_images_public_select" on public.product_images;
create policy "product_images_public_select" on public.product_images
for select to anon, authenticated using (
  exists (select 1 from public.products p where p.id = product_images.product_id and p.status = 'active')
);

grant select on public.products to anon, authenticated;
grant select on public.product_categories to anon, authenticated;
grant select on public.product_images to anon, authenticated;

notify pgrst, 'reload schema';