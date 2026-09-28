-- Make the new product catalog usable by the public storefront.
-- The storefront only exposes active catalog data; administrative writes remain protected.

alter table public.products
  add column if not exists variations jsonb;

grant select on public.products, public.product_categories, public.product_images, public.marcas
to anon, authenticated;

drop policy if exists "products_public_select" on public.products;
create policy "products_public_select"
on public.products
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "product_images_public_select" on public.product_images;
create policy "product_images_public_select"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_images.product_id
      and p.status = 'active'
  )
);

drop policy if exists "product_categories_public_select" on public.product_categories;
create policy "product_categories_public_select"
on public.product_categories
for select
to anon, authenticated
using (true);

notify pgrst, 'reload schema';
