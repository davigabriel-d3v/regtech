-- Collapse public/authenticated catalog read policies into a single policy per table.

drop policy if exists "products_public_select_active" on public.products;
drop policy if exists "products_permission_select" on public.products;
create policy "products_catalog_select"
on public.products for select to anon, authenticated
using (
  status = 'active'
  or (select public.has_permission(auth.uid(), 'produtos'))
);

drop policy if exists "product_images_public_select" on public.product_images;
drop policy if exists "product_images_permission_select" on public.product_images;
create policy "product_images_catalog_select"
on public.product_images for select to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_images.product_id
      and (
        p.status = 'active'
        or (select public.has_permission(auth.uid(), 'produtos'))
      )
  )
);

notify pgrst, 'reload schema';
