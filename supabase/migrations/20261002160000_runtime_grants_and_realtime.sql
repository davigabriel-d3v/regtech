-- Runtime grants: keep API privileges broad enough for RLS to be the authorization boundary.
-- Anonymous users may only read the public storefront/catalog.

revoke all on public.profiles from anon;
revoke all on public.user_roles from anon;
revoke all on public.access_permissions from anon;
revoke all on public.customers from anon;
revoke all on public.orders from anon;
revoke all on public.order_items from anon;
revoke all on public.order_status_history from anon;
revoke all on public.product_code_registry from anon;
revoke all on public.product_id_registry from anon;

revoke all on public.profiles from authenticated;
grant select, insert, update on public.profiles to authenticated;

revoke all on public.user_roles from authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;

revoke all on public.access_permissions from authenticated;
grant select, insert, update, delete on public.access_permissions to authenticated;

revoke all on public.products from anon;
grant select on public.products to anon;
revoke all on public.products from authenticated;
grant select, insert, update, delete on public.products to authenticated;

revoke all on public.product_images from anon;
grant select on public.product_images to anon;
revoke all on public.product_images from authenticated;
grant select, insert, update, delete on public.product_images to authenticated;

revoke all on public.product_categories from anon;
grant select on public.product_categories to anon;
revoke all on public.product_categories from authenticated;
grant select, insert, update, delete on public.product_categories to authenticated;

revoke all on public.marcas from anon;
grant select on public.marcas to anon;
revoke all on public.marcas from authenticated;
grant select, insert, update, delete on public.marcas to authenticated;

revoke all on public.customers from authenticated;
grant select, update on public.customers to authenticated;

revoke all on public.orders from authenticated;
grant select, update on public.orders to authenticated;

revoke all on public.order_items from authenticated;
grant select on public.order_items to authenticated;

revoke all on public.order_status_history from authenticated;
grant select on public.order_status_history to authenticated;

-- Realtime is used by the admin UI; add tables idempotently.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='orders') then
      execute 'alter publication supabase_realtime add table public.orders';
    end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='products') then
      execute 'alter publication supabase_realtime add table public.products';
    end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='customers') then
      execute 'alter publication supabase_realtime add table public.customers';
    end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='product_images') then
      execute 'alter publication supabase_realtime add table public.product_images';
    end if;
  end if;
end
$$;

notify pgrst, 'reload schema';
