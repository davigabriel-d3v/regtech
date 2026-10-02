-- Fix the public order workflow: disambiguate output parameter order_number
-- from the orders.order_number column inside PL/pgSQL.

create or replace function public.create_public_order(
  p_product_id uuid,
  p_quantity integer,
  p_customer jsonb,
  p_notes text default null,
  p_selected_variation jsonb default null
)
returns table(order_id uuid, order_number bigint, order_number_display text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_image text;
  v_customer_id uuid;
  v_phone text;
  v_email text;
  v_name text;
  v_order_id uuid;
  v_order_number bigint;
  v_email_normalized text;
begin
  if p_product_id is null then raise exception 'Produto inválido'; end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 999 then
    raise exception 'Quantidade inválida';
  end if;
  if p_customer is null or jsonb_typeof(p_customer) <> 'object' then
    raise exception 'Dados do cliente inválidos';
  end if;

  v_name := btrim(coalesce(p_customer->>'name', ''));
  v_phone := regexp_replace(coalesce(p_customer->>'phone', ''), '[^0-9+]', '', 'g');
  v_email := lower(btrim(coalesce(p_customer->>'email', '')));
  v_email_normalized := nullif(v_email, '');

  if length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'Nome inválido';
  end if;
  if length(v_phone) < 8 or length(v_phone) > 20 then
    raise exception 'Telefone inválido';
  end if;
  if v_email_normalized is not null
    and v_email_normalized !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'E-mail inválido';
  end if;

  select * into v_product
  from public.products
  where id = p_product_id and status = 'active'
  for share;

  if not found then raise exception 'Produto não disponível'; end if;
  if v_product.stock < p_quantity then
    raise exception 'Quantidade indisponível em estoque';
  end if;

  select pi.image_url into v_image
  from public.product_images pi
  where pi.product_id = v_product.id
  order by pi.is_primary desc, pi.display_order asc
  limit 1;

  select c.id into v_customer_id
  from public.customers c
  where c.phone_normalized = v_phone
  limit 1;

  if v_customer_id is null and v_email_normalized is not null then
    select c.id into v_customer_id
    from public.customers c
    where c.email_normalized = v_email_normalized
    limit 1;
  end if;

  if v_customer_id is null then
    insert into public.customers(
      name, phone, phone_normalized, whatsapp, email, email_normalized
    )
    values (
      v_name,
      btrim(coalesce(p_customer->>'phone', '')),
      v_phone,
      nullif(btrim(coalesce(p_customer->>'whatsapp', '')), ''),
      nullif(btrim(coalesce(p_customer->>'email', '')), ''),
      v_email_normalized
    )
    returning id into v_customer_id;
  else
    update public.customers
    set name = v_name,
        phone = btrim(coalesce(p_customer->>'phone', '')),
        whatsapp = nullif(btrim(coalesce(p_customer->>'whatsapp', '')), ''),
        email = nullif(btrim(coalesce(p_customer->>'email', '')), '')
    where id = v_customer_id;
  end if;

  insert into public.orders(customer_id, status, notes)
  values (v_customer_id, 'new', nullif(btrim(coalesce(p_notes, '')), ''))
  returning public.orders.id, public.orders.order_number
  into v_order_id, v_order_number;

  insert into public.order_items(
    order_id, product_id, product_code, product_name, product_image,
    product_sku, quantity, selected_variation
  )
  values (
    v_order_id, v_product.id, v_product.product_code, v_product.name,
    v_image, v_product.sku, p_quantity, p_selected_variation
  );

  return query
  select
    v_order_id,
    v_order_number,
    'PED-' || lpad(v_order_number::text, 6, '0');
end;
$$;

revoke all on function public.create_public_order(uuid, integer, jsonb, text, jsonb)
from public;
grant execute on function public.create_public_order(uuid, integer, jsonb, text, jsonb)
to anon, authenticated;

notify pgrst, 'reload schema';
