drop policy if exists "products_permission_select" on public.products;
create policy "products_permission_select" on public.products for select to authenticated
using (public.has_permission(auth.uid(),'produtos') or public.has_permission(auth.uid(),'estoque'));

drop policy if exists "product_images_permission_select" on public.product_images;
create policy "product_images_permission_select" on public.product_images for select to authenticated
using (public.has_permission(auth.uid(),'produtos') or public.has_permission(auth.uid(),'estoque'));

notify pgrst,'reload schema';