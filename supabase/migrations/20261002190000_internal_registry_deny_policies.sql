-- Internal registries are intentionally inaccessible through PostgREST.
-- Explicit deny policies document that boundary and silence false-positive
-- "RLS enabled without policy" advisories.

drop policy if exists "product_code_registry_no_api_access" on public.product_code_registry;
create policy "product_code_registry_no_api_access"
on public.product_code_registry
for all to anon, authenticated
using (false)
with check (false);

drop policy if exists "product_id_registry_no_api_access" on public.product_id_registry;
create policy "product_id_registry_no_api_access"
on public.product_id_registry
for all to anon, authenticated
using (false)
with check (false);

notify pgrst, 'reload schema';
