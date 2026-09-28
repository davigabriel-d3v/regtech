-- Security hardening for personal and sensitive customer/profile data.
-- Keep RLS as the authorization boundary and remove broad table/column grants.

-- Profiles: users can read/update their own profile; admins can read profiles.
revoke select on public.profiles from authenticated;
grant select (id, nome, whatsapp, criado_em) on public.profiles to authenticated;
revoke insert on public.profiles from authenticated;
grant insert (id, nome, whatsapp) on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (nome, whatsapp) on public.profiles to authenticated;

drop policy if exists "Ver proprio perfil" on public.profiles;
drop policy if exists "Editar proprio perfil" on public.profiles;
drop policy if exists "Criar proprio perfil" on public.profiles;

create policy "Ver proprio perfil" on public.profiles
for select to authenticated
using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

create policy "Editar proprio perfil" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Criar proprio perfil" on public.profiles
for insert to authenticated
with check (auth.uid() = id);

-- Customer records are private. Only users with the clientes module can read them.
-- Normalized contact fields are internal and are never exposed through PostgREST.
revoke select on public.customers from authenticated;
grant select (id, name, phone, whatsapp, email, created_at, updated_at) on public.customers to authenticated;
revoke update on public.customers from authenticated;

drop policy if exists "customers_admin_select" on public.customers;
drop policy if exists "customers_admin_update" on public.customers;
drop policy if exists "customers_permission_select" on public.customers;
drop policy if exists "customers_permission_update" on public.customers;
create policy "customers_permission_select" on public.customers
for select to authenticated
using (public.has_permission(auth.uid(), 'clientes'));

-- Orders are private. Users with the pedidos module can read them and change status only.
revoke select on public.orders from authenticated;
grant select (id, order_number, customer_id, status, notes, created_at, updated_at) on public.orders to authenticated;
revoke update on public.orders from authenticated;
grant update (status) on public.orders to authenticated;

drop policy if exists "orders_admin_select" on public.orders;
drop policy if exists "orders_permission_select" on public.orders;
create policy "orders_permission_select" on public.orders
for select to authenticated
using (public.has_permission(auth.uid(), 'pedidos'));

drop policy if exists "orders_admin_update" on public.orders;
drop policy if exists "orders_permission_update" on public.orders;
create policy "orders_permission_update" on public.orders
for update to authenticated
using (public.has_permission(auth.uid(), 'pedidos'))
with check (public.has_permission(auth.uid(), 'pedidos'));

-- Order items/history contain operational data only; keep access restricted to the pedidos module.
revoke select on public.order_items from authenticated;
grant select (id, order_id, product_id, product_code, product_name, product_image, product_sku, quantity, selected_variation, created_at) on public.order_items to authenticated;

revoke select on public.order_status_history from authenticated;
grant select (id, order_id, old_status, new_status, changed_by, created_at) on public.order_status_history to authenticated;

drop policy if exists "order_items_admin_select" on public.order_items;
drop policy if exists "order_items_permission_select" on public.order_items;
create policy "order_items_permission_select" on public.order_items
for select to authenticated
using (public.has_permission(auth.uid(), 'pedidos'));

drop policy if exists "order_history_admin_select" on public.order_status_history;
drop policy if exists "order_history_permission_select" on public.order_status_history;
create policy "order_history_permission_select" on public.order_status_history
for select to authenticated
using (public.has_permission(auth.uid(), 'pedidos'));

-- Permission rows are readable by the account owner only; mutations remain admin-only.
revoke all on public.access_permissions from authenticated;
grant select, insert, update, delete on public.access_permissions to authenticated;

drop policy if exists "access_permissions_admin_all" on public.access_permissions;
drop policy if exists "access_permissions_self_select" on public.access_permissions;

create policy "access_permissions_admin_all" on public.access_permissions
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "access_permissions_self_select" on public.access_permissions
for select to authenticated
using (auth.uid() = user_id);


notify pgrst, 'reload schema';
