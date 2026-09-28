-- Authentication, RBAC and least-privilege hardening for the admin panel.

alter type public.app_role add value if not exists 'operator';

create table if not exists public.product_id_registry (
  product_id uuid primary key,
  reserved_at timestamptz not null default now()
);

alter table public.product_id_registry enable row level security;
revoke all on public.product_id_registry from anon, authenticated;

insert into public.product_id_registry(product_id)
select id from public.products
on conflict do nothing;

create or replace function public.lock_product_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.id is distinct from new.id then
    raise exception 'product id cannot be changed';
  end if;

  if tg_op = 'INSERT' then
    begin
      insert into public.product_id_registry(product_id) values (new.id);
    exception when unique_violation then
      raise exception 'product id already exists or was previously used';
    end;
  end if;

  return new;
end;
$$;

drop trigger if exists products_product_id_guard on public.products;
create trigger products_product_id_guard
before insert or update of id on public.products
for each row execute function public.lock_product_id();

revoke execute on function public.lock_product_id() from public, anon, authenticated;

-- Products: everyone can only see active storefront rows anonymously.
-- Authenticated staff can see the catalog only through their module permission.
-- Only admins can mutate products.
revoke all on public.products from anon, authenticated;
grant select (
  id, product_code, name, description, category_id, brand_id, price,
  promotional_price, stock, minimum_stock, sku, barcode, notes, status,
  created_at, updated_at, variations
) on public.products to anon, authenticated;
grant insert (
  name, description, category_id, brand_id, price, promotional_price,
  stock, minimum_stock, sku, barcode, notes, status, variations
) on public.products to authenticated;
grant update (
  name, description, category_id, brand_id, price, promotional_price,
  stock, minimum_stock, sku, barcode, notes, status, variations
) on public.products to authenticated;
grant delete on public.products to authenticated;

drop policy if exists "products_admin_select" on public.products;
drop policy if exists "products_admin_insert" on public.products;
drop policy if exists "products_admin_update" on public.products;
drop policy if exists "products_admin_delete" on public.products;
drop policy if exists "products_permission_select" on public.products;
drop policy if exists "products_permission_insert" on public.products;
drop policy if exists "products_permission_update" on public.products;
drop policy if exists "products_permission_delete" on public.products;
drop policy if exists "products_public_select_active" on public.products;
drop policy if exists "products_public_select" on public.products;

create policy "products_public_select_active"
on public.products for select to anon
using (status = 'active');

create policy "products_permission_select"
on public.products for select to authenticated
using (public.has_permission(auth.uid(), 'produtos'));

create policy "products_admin_insert"
on public.products for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "products_admin_update"
on public.products for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "products_admin_delete"
on public.products for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Product images: public read remains available for active products;
-- write operations remain administrator-only.
revoke all on public.product_images from anon, authenticated;
grant select (id, product_id, storage_path, image_url, is_primary, display_order, created_at)
  on public.product_images to anon, authenticated;
grant insert (product_id, storage_path, image_url, is_primary, display_order)
  on public.product_images to authenticated;
grant update (storage_path, image_url, is_primary, display_order)
  on public.product_images to authenticated;
grant delete on public.product_images to authenticated;

drop policy if exists "product_images_admin_select" on public.product_images;
drop policy if exists "product_images_admin_insert" on public.product_images;
drop policy if exists "product_images_admin_update" on public.product_images;
drop policy if exists "product_images_admin_delete" on public.product_images;
drop policy if exists "product_images_permission_select" on public.product_images;
drop policy if exists "product_images_permission_insert" on public.product_images;
drop policy if exists "product_images_permission_update" on public.product_images;
drop policy if exists "product_images_permission_delete" on public.product_images;
drop policy if exists "product_images_public_select" on public.product_images;

create policy "product_images_public_select"
on public.product_images for select to anon
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.status = 'active'
  )
);

create policy "product_images_permission_select"
on public.product_images for select to authenticated
using (public.has_permission(auth.uid(), 'produtos'));

create policy "product_images_admin_insert"
on public.product_images for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "product_images_admin_update"
on public.product_images for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "product_images_admin_delete"
on public.product_images for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Categories/brands: public storefront read; only admins may change catalog metadata.
revoke all on public.product_categories from anon, authenticated;
grant select on public.product_categories to anon, authenticated;
create policy "product_categories_public_select"
on public.product_categories for select to anon, authenticated
using (true);
create policy "product_categories_admin_mutation"
on public.product_categories for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

revoke all on public.marcas from anon, authenticated;
grant select on public.marcas to anon, authenticated;
grant insert, update, delete on public.marcas to authenticated;

drop policy if exists "marcas_public_select" on public.marcas;
drop policy if exists "marcas_admin_insert" on public.marcas;
drop policy if exists "marcas_admin_update" on public.marcas;
drop policy if exists "marcas_admin_delete" on public.marcas;
create policy "marcas_public_select"
on public.marcas for select to anon, authenticated
using (ativo = true);
create policy "marcas_admin_insert"
on public.marcas for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));
create policy "marcas_admin_update"
on public.marcas for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));
create policy "marcas_admin_delete"
on public.marcas for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Customer data: operators can read when explicitly granted the clientes module,
-- but only admins can edit customer records.
revoke all on public.customers from anon, authenticated;
grant select (id, name, phone, whatsapp, email, status, created_at, updated_at)
  on public.customers to authenticated;
grant update (name, email, phone, whatsapp, status) on public.customers to authenticated;

drop policy if exists "customers_admin_select" on public.customers;
drop policy if exists "customers_admin_update" on public.customers;
drop policy if exists "customers_permission_select" on public.customers;
drop policy if exists "customers_permission_update" on public.customers;
create policy "customers_permission_select"
on public.customers for select to authenticated
using (public.has_permission(auth.uid(), 'clientes'));
create policy "customers_admin_update"
on public.customers for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Orders: operators can read orders and change only status;
-- no direct client-side inserts are allowed.
revoke all on public.orders from anon, authenticated;
grant select (id, order_number, customer_id, status, notes, created_at, updated_at)
  on public.orders to authenticated;
grant update (status) on public.orders to authenticated;

drop policy if exists "orders_admin_select" on public.orders;
drop policy if exists "orders_admin_update" on public.orders;
drop policy if exists "orders_permission_select" on public.orders;
drop policy if exists "orders_permission_update" on public.orders;
create policy "orders_permission_select"
on public.orders for select to authenticated
using (public.has_permission(auth.uid(), 'pedidos'));
create policy "orders_permission_update"
on public.orders for update to authenticated
using (public.has_permission(auth.uid(), 'pedidos'))
with check (public.has_permission(auth.uid(), 'pedidos'));

revoke all on public.order_items from anon, authenticated;
grant select (
  id, order_id, product_id, product_code, product_name, product_image,
  product_sku, quantity, selected_variation, created_at
) on public.order_items to authenticated;
drop policy if exists "order_items_admin_select" on public.order_items;
drop policy if exists "order_items_permission_select" on public.order_items;
create policy "order_items_permission_select"
on public.order_items for select to authenticated
using (public.has_permission(auth.uid(), 'pedidos'));

revoke all on public.order_status_history from anon, authenticated;
grant select on public.order_status_history to authenticated;
drop policy if exists "order_history_admin_select" on public.order_status_history;
drop policy if exists "order_history_permission_select" on public.order_status_history;
create policy "order_history_permission_select"
on public.order_status_history for select to authenticated
using (public.has_permission(auth.uid(), 'pedidos'));

-- Permission management is administrator-only.
revoke all on public.access_permissions from anon, authenticated;
grant select, insert, update, delete on public.access_permissions to authenticated;
drop policy if exists "access_permissions_admin_all" on public.access_permissions;
drop policy if exists "access_permissions_self_select" on public.access_permissions;
create policy "access_permissions_admin_all"
on public.access_permissions for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));
create policy "access_permissions_self_select"
on public.access_permissions for select to authenticated
using (auth.uid() = user_id);

-- Role management remains administrator-only.
revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;
grant insert, update, delete on public.user_roles to authenticated;
drop policy if exists "user_roles_self_select" on public.user_roles;
drop policy if exists "user_roles_admin_mutate" on public.user_roles;
create policy "user_roles_self_select"
on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "user_roles_admin_mutate"
on public.user_roles for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Public order creation remains function-only.
revoke insert, update, delete, select on public.customers from anon;
revoke insert, update, delete, select on public.orders from anon;
revoke insert, update, delete, select on public.order_items from anon;
revoke insert, update, delete, select on public.order_status_history from anon;

notify pgrst, 'reload schema';