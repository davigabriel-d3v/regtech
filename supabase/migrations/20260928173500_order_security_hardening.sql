-- Least-privilege hardening for the order/catalog API.
revoke execute on function public.set_customers_updated_at() from public, anon, authenticated;
revoke execute on function public.set_orders_updated_at() from public, anon, authenticated;
revoke execute on function public.record_order_status_history() from public, anon, authenticated;
revoke execute on function public.generate_product_code() from public, anon;
grant execute on function public.generate_product_code() to authenticated;
revoke execute on function public.lock_product_code() from public, anon, authenticated;
revoke execute on function public.set_products_updated_at() from public, anon, authenticated;

-- Anonymous storefront only needs public catalog fields.
revoke select on public.products from anon;
grant select (id, product_code, name, description, category_id, brand_id, price, promotional_price, stock, status, variations, created_at, updated_at) on public.products to anon;

-- Enable Postgres Changes for the admin order refresh when the publication exists.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
     ) then
    execute 'alter publication supabase_realtime add table public.orders';
  end if;
end;
$$;

notify pgrst, 'reload schema';