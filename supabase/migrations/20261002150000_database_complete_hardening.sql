-- REGTECH CELLSHOP: final schema, authorization and API hardening.

-- Internal registries must never be readable/writable through the public API.
alter table public.product_code_registry enable row level security;
revoke all on public.product_code_registry from anon, authenticated;
revoke execute on function public.generate_product_code() from anon, authenticated;

-- Keep the product catalog readable to the public storefront, with authenticated
-- users additionally authorized by their module permissions.
drop policy if exists "products_admin_select" on public.products;
drop policy if exists "products_permission_select" on public.products;
drop policy if exists "products_public_select" on public.products;
drop policy if exists "products_public_select_active" on public.products;
create policy "products_public_select_active"
on public.products for select to anon, authenticated
using (status = 'active');
create policy "products_permission_select"
on public.products for select to authenticated
using ((select public.has_permission(auth.uid(), 'produtos')));
drop policy if exists "products_admin_insert" on public.products;
drop policy if exists "products_admin_update" on public.products;
drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_insert"
on public.products for insert to authenticated
with check ((select public.has_role(auth.uid(), 'admin')));
create policy "products_admin_update"
on public.products for update to authenticated
using ((select public.has_role(auth.uid(), 'admin')))
with check ((select public.has_role(auth.uid(), 'admin')));
create policy "products_admin_delete"
on public.products for delete to authenticated
using ((select public.has_role(auth.uid(), 'admin')));

-- Product images: public only for active products; permission users may manage
-- them, while mutations stay restricted to admins.
drop policy if exists "product_images_admin_select" on public.product_images;
drop policy if exists "product_images_permission_select" on public.product_images;
drop policy if exists "product_images_public_select" on public.product_images;
create policy "product_images_public_select"
on public.product_images for select to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.status = 'active'
  )
);
create policy "product_images_permission_select"
on public.product_images for select to authenticated
using ((select public.has_permission(auth.uid(), 'produtos')));
drop policy if exists "product_images_admin_insert" on public.product_images;
drop policy if exists "product_images_admin_update" on public.product_images;
drop policy if exists "product_images_admin_delete" on public.product_images;
create policy "product_images_admin_insert"
on public.product_images for insert to authenticated
with check ((select public.has_role(auth.uid(), 'admin')));
create policy "product_images_admin_update"
on public.product_images for update to authenticated
using ((select public.has_role(auth.uid(), 'admin')))
with check ((select public.has_role(auth.uid(), 'admin')));
create policy "product_images_admin_delete"
on public.product_images for delete to authenticated
using ((select public.has_role(auth.uid(), 'admin')));

-- Categories: one public read policy and separate admin mutations.
drop policy if exists "product_categories_public_select" on public.product_categories;
drop policy if exists "product_categories_admin_mutation" on public.product_categories;
drop policy if exists "product_categories_admin_select" on public.product_categories;
drop policy if exists "product_categories_permission_select" on public.product_categories;
create policy "product_categories_public_select"
on public.product_categories for select to anon, authenticated
using (true);
create policy "product_categories_admin_insert"
on public.product_categories for insert to authenticated
with check ((select public.has_role(auth.uid(), 'admin')));
create policy "product_categories_admin_update"
on public.product_categories for update to authenticated
using ((select public.has_role(auth.uid(), 'admin')))
with check ((select public.has_role(auth.uid(), 'admin')));
create policy "product_categories_admin_delete"
on public.product_categories for delete to authenticated
using ((select public.has_role(auth.uid(), 'admin')));

-- Brands: public read, admin mutations.
drop policy if exists "marcas_public_select" on public.marcas;
drop policy if exists "marcas_admin_insert" on public.marcas;
drop policy if exists "marcas_admin_update" on public.marcas;
drop policy if exists "marcas_admin_delete" on public.marcas;
create policy "marcas_public_select"
on public.marcas for select to anon, authenticated
using (ativo = true);
create policy "marcas_admin_insert"
on public.marcas for insert to authenticated
with check ((select public.has_role(auth.uid(), 'admin')));
create policy "marcas_admin_update"
on public.marcas for update to authenticated
using ((select public.has_role(auth.uid(), 'admin')))
with check ((select public.has_role(auth.uid(), 'admin')));
create policy "marcas_admin_delete"
on public.marcas for delete to authenticated
using ((select public.has_role(auth.uid(), 'admin')));

-- Customer edits must respect the same module permission as customer reads.
drop policy if exists "customers_admin_select" on public.customers;
drop policy if exists "customers_admin_update" on public.customers;
drop policy if exists "customers_permission_select" on public.customers;
drop policy if exists "customers_permission_update" on public.customers;
create policy "customers_permission_select"
on public.customers for select to authenticated
using ((select public.has_permission(auth.uid(), 'clientes')));
create policy "customers_permission_update"
on public.customers for update to authenticated
using ((select public.has_permission(auth.uid(), 'clientes')))
with check ((select public.has_permission(auth.uid(), 'clientes')));

-- Orders are visible/editable to users with the pedidos module.
drop policy if exists "orders_admin_select" on public.orders;
drop policy if exists "orders_admin_update" on public.orders;
drop policy if exists "orders_permission_select" on public.orders;
drop policy if exists "orders_permission_update" on public.orders;
create policy "orders_permission_select"
on public.orders for select to authenticated
using ((select public.has_permission(auth.uid(), 'pedidos')));
create policy "orders_permission_update"
on public.orders for update to authenticated
using ((select public.has_permission(auth.uid(), 'pedidos')))
with check ((select public.has_permission(auth.uid(), 'pedidos')));

drop policy if exists "order_items_admin_select" on public.order_items;
drop policy if exists "order_items_permission_select" on public.order_items;
create policy "order_items_permission_select"
on public.order_items for select to authenticated
using ((select public.has_permission(auth.uid(), 'pedidos')));

drop policy if exists "order_history_admin_select" on public.order_status_history;
drop policy if exists "order_history_permission_select" on public.order_status_history;
create policy "order_history_permission_select"
on public.order_status_history for select to authenticated
using ((select public.has_permission(auth.uid(), 'pedidos')));

-- Profiles use one policy per operation to avoid duplicate permissive policies.
drop policy if exists "profiles_self_select" on public.profiles;
drop policy if exists "profiles_self_insert" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "Ver proprio perfil" on public.profiles;
drop policy if exists "Editar proprio perfil" on public.profiles;
drop policy if exists "Criar proprio perfil" on public.profiles;
create policy "profiles_self_select"
on public.profiles for select to authenticated
using (
  id = auth.uid() or (select public.has_role(auth.uid(), 'admin'))
);
create policy "profiles_self_insert"
on public.profiles for insert to authenticated
with check (id = auth.uid());
create policy "profiles_self_update"
on public.profiles for update to authenticated
using (id = auth.uid() or (select public.has_role(auth.uid(), 'admin')))
with check (id = auth.uid() or (select public.has_role(auth.uid(), 'admin')));

-- Roles: users can read themselves; only admins can mutate roles.
drop policy if exists "user_roles_self_select" on public.user_roles;
drop policy if exists "user_roles_admin_mutate" on public.user_roles;
create policy "user_roles_self_select"
on public.user_roles for select to authenticated
using (user_id = auth.uid() or (select public.has_role(auth.uid(), 'admin')));
create policy "user_roles_admin_insert"
on public.user_roles for insert to authenticated
with check ((select public.has_role(auth.uid(), 'admin')));
create policy "user_roles_admin_update"
on public.user_roles for update to authenticated
using ((select public.has_role(auth.uid(), 'admin')))
with check ((select public.has_role(auth.uid(), 'admin')));
create policy "user_roles_admin_delete"
on public.user_roles for delete to authenticated
using ((select public.has_role(auth.uid(), 'admin')));

-- Access permissions: self-read plus admin mutations.
drop policy if exists "access_permissions_admin_all" on public.access_permissions;
drop policy if exists "access_permissions_self_select" on public.access_permissions;
create policy "access_permissions_self_select"
on public.access_permissions for select to authenticated
using (user_id = auth.uid() or (select public.has_role(auth.uid(), 'admin')));
create policy "access_permissions_admin_insert"
on public.access_permissions for insert to authenticated
with check ((select public.has_role(auth.uid(), 'admin')));
create policy "access_permissions_admin_update"
on public.access_permissions for update to authenticated
using ((select public.has_role(auth.uid(), 'admin')))
with check ((select public.has_role(auth.uid(), 'admin')));
create policy "access_permissions_admin_delete"
on public.access_permissions for delete to authenticated
using ((select public.has_role(auth.uid(), 'admin')));

-- Keep normalization consistent when an admin edits a customer.
create or replace function public.sync_customer_normalized_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.phone_normalized := regexp_replace(coalesce(new.phone, ''), '[^0-9+]', '', 'g');
  new.email_normalized := nullif(lower(btrim(coalesce(new.email, ''))), '');
  return new;
end;
$$;

drop trigger if exists customers_normalize_fields on public.customers;
create trigger customers_normalize_fields
before insert or update of phone, email on public.customers
for each row execute function public.sync_customer_normalized_fields();

revoke execute on function public.sync_customer_normalized_fields() from public, anon, authenticated;

-- Covering indexes for frequently joined foreign keys.
create index if not exists order_status_history_changed_by_idx
  on public.order_status_history(changed_by);
create index if not exists products_brand_id_idx
  on public.products(brand_id);

notify pgrst, 'reload schema';
