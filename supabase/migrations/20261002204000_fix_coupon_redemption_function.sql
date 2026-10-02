create or replace function public.redeem_coupon(
  p_code text,
  p_identifier text
)
returns table (
  success boolean,
  message text,
  coupon_id uuid,
  code text,
  reward_type text,
  reward_value numeric,
  reward_text text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.coupons;
  ident text;
  total_count integer;
  identifier_count integer;
begin
  ident := lower(btrim(coalesce(p_identifier, '')));

  if btrim(coalesce(p_code, '')) = '' then
    return query select false, 'Informe o cupom.', null::uuid, null::text, null::text, 0::numeric, null::text;
    return;
  end if;

  if ident = '' or length(ident) < 3 or length(ident) > 255 then
    return query select false, 'Informe um identificador válido (e-mail ou telefone).', null::uuid, null::text, null::text, 0::numeric, null::text;
    return;
  end if;

  select c.*
    into c
  from public.coupons as c
  where c.code = upper(btrim(p_code))
  limit 1
  for update;

  if not found then
    return query select false, 'Cupom não encontrado.', null::uuid, null::text, null::text, 0::numeric, null::text;
    return;
  end if;

  if not c.active then
    return query select false, 'Este cupom está pausado.', c.id, c.code, c.reward_type, c.reward_value, c.reward_text;
    return;
  end if;

  if c.starts_at is not null and now() < c.starts_at then
    return query select false, 'Este cupom ainda não está disponível.', c.id, c.code, c.reward_type, c.reward_value, c.reward_text;
    return;
  end if;

  if c.expires_at is not null and now() > c.expires_at then
    return query select false, 'Este cupom expirou.', c.id, c.code, c.reward_type, c.reward_value, c.reward_text;
    return;
  end if;

  select count(*) into total_count
  from public.coupon_redemptions as r
  where r.coupon_id = c.id;

  if c.max_redemptions is not null and total_count >= c.max_redemptions then
    return query select false, 'Este cupom atingiu o limite de resgates.', c.id, c.code, c.reward_type, c.reward_value, c.reward_text;
    return;
  end if;

  select count(*) into identifier_count
  from public.coupon_redemptions as r
  where r.coupon_id = c.id and r.identifier = ident;

  if identifier_count >= c.max_redemptions_per_identifier then
    return query select false, 'Este cupom já foi resgatado o limite permitido para este identificador.', c.id, c.code, c.reward_type, c.reward_value, c.reward_text;
    return;
  end if;

  insert into public.coupon_redemptions(coupon_id, identifier)
  values (c.id, ident);

  return query
    select true, 'Cupom resgatado com sucesso.', c.id, c.code, c.reward_type, c.reward_value, c.reward_text;
end;
$$;

revoke all on function public.redeem_coupon(text,text) from public, anon, authenticated;
grant execute on function public.redeem_coupon(text,text) to anon, authenticated;

notify pgrst, 'reload schema';
