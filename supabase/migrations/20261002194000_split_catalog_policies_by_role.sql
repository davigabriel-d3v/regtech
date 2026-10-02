-- Keep public storefront reads independent from authenticated RBAC helpers.
-- Anon must not need EXECUTE on has_permission/has_role just to read active products.

drop policy if exists "products_catalog_select" on public.products;
create policy "products_anon_select_active"
on public.products for select to anon
using (status = 'active');

create policy "products_authenticated_select"
on public.products for select to authenticated
using (
  status = 'active'
  or (select public.has_permission(auth.uid(), 'produtos'))
);

drop policy if exists "product_images_catalog_select" on public.product_images;
create policy "product_images_anon_select_active"
on public.product_images for select to anon
using (
  exists (
    select 1
    from public.products p
    where p.id = product_images.product_id
      and p.status = 'active'
  )
);

create policy "product_images_authenticated_select"
on public.product_images for select to authenticated
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
