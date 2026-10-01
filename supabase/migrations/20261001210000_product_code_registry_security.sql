-- Keep the internal product-code registry inaccessible to API roles.
-- SECURITY DEFINER functions remain responsible for reserving and validating codes.

alter table public.product_code_registry enable row level security;

revoke all on public.product_code_registry from anon, authenticated;
revoke execute on function public.generate_product_code() from anon, authenticated;

notify pgrst, 'reload schema';
