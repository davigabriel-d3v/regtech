-- Authenticated admin inserts need EXECUTE on the product-code generator
-- because PostgreSQL evaluates the column default under the caller's privileges.
-- The function remains SECURITY DEFINER and only generates a candidate code;
-- the reservation trigger protects uniqueness in the internal registry.

grant execute on function public.generate_product_code() to authenticated;

notify pgrst, 'reload schema';
