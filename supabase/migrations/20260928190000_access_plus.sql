create table if not exists public.access_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('dashboard','produtos','pedidos','clientes','estoque','acesso_plus','configuracoes')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, module)
);

create index if not exists access_permissions_user_idx on public.access_permissions(user_id);
alter table public.access_permissions enable row level security;

create or replace function public.has_permission(p_user_id uuid, p_module text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(p_user_id, 'admin')
    or exists (
      select 1 from public.access_permissions ap
      where ap.user_id = p_user_id and ap.module = p_module and ap.enabled
    );
$$;

revoke all on function public.has_permission(uuid,text) from public;
grant execute on function public.has_permission(uuid,text) to authenticated;

drop policy if exists "access_permissions_admin_all" on public.access_permissions;
create policy "access_permissions_admin_all" on public.access_permissions
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

grant select, insert, update, delete on public.access_permissions to authenticated;

drop policy if exists "products_permission_select" on public.products;
drop policy if exists "products_permission_insert" on public.products;
drop policy if exists "products_permission_update" on public.products;
drop policy if exists "products_permission_delete" on public.products;
create policy "products_permission_select" on public.products for select to authenticated using (public.has_permission(auth.uid(), 'produtos'));
create policy "products_permission_insert" on public.products for insert to authenticated with check (public.has_permission(auth.uid(), 'produtos'));
create policy "products_permission_update" on public.products for update to authenticated using (public.has_permission(auth.uid(), 'produtos')) with check (public.has_permission(auth.uid(), 'produtos'));
create policy "products_permission_delete" on public.products for delete to authenticated using (public.has_permission(auth.uid(), 'produtos'));

drop policy if exists "product_images_permission_select" on public.product_images;
drop policy if exists "product_images_permission_insert" on public.product_images;
drop policy if exists "product_images_permission_update" on public.product_images;
drop policy if exists "product_images_permission_delete" on public.product_images;
create policy "product_images_permission_select" on public.product_images for select to authenticated using (public.has_permission(auth.uid(), 'produtos'));
create policy "product_images_permission_insert" on public.product_images for insert to authenticated with check (public.has_permission(auth.uid(), 'produtos'));
create policy "product_images_permission_update" on public.product_images for update to authenticated using (public.has_permission(auth.uid(), 'produtos')) with check (public.has_permission(auth.uid(), 'produtos'));
create policy "product_images_permission_delete" on public.product_images for delete to authenticated using (public.has_permission(auth.uid(), 'produtos'));

drop policy if exists "product_categories_permission_select" on public.product_categories;
create policy "product_categories_permission_select" on public.product_categories for select to authenticated using (public.has_permission(auth.uid(), 'produtos'));

drop policy if exists "customers_permission_select" on public.customers;
drop policy if exists "customers_permission_update" on public.customers;
create policy "customers_permission_select" on public.customers for select to authenticated using (public.has_permission(auth.uid(), 'clientes'));
create policy "customers_permission_update" on public.customers for update to authenticated using (public.has_permission(auth.uid(), 'clientes')) with check (public.has_permission(auth.uid(), 'clientes'));

drop policy if exists "orders_permission_select" on public.orders;
drop policy if exists "orders_permission_update" on public.orders;
create policy "orders_permission_select" on public.orders for select to authenticated using (public.has_permission(auth.uid(), 'pedidos'));
create policy "orders_permission_update" on public.orders for update to authenticated using (public.has_permission(auth.uid(), 'pedidos')) with check (public.has_permission(auth.uid(), 'pedidos'));

drop policy if exists "order_items_permission_select" on public.order_items;
create policy "order_items_permission_select" on public.order_items for select to authenticated using (public.has_permission(auth.uid(), 'pedidos'));

drop policy if exists "order_history_permission_select" on public.order_status_history;
create policy "order_history_permission_select" on public.order_status_history for select to authenticated using (public.has_permission(auth.uid(), 'pedidos'));

notify pgrst, 'reload schema';