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
  coupon_row public.coupons;
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

  select cp.id, cp.code, cp.name, cp.description, cp.reward_type, cp.reward_value,
         cp.reward_text, cp.max_redemptions, cp.max_redemptions_per_identifier,
         cp.starts_at, cp.expires_at, cp.active, cp.resettable, cp.created_at, cp.updated_at
    into coupon_row
  from public.coupons as cp
  where cp.code = upper(btrim(p_code))
  limit 1
  for update;

  if not found then
    return query select false, 'Cupom não encontrado.', null::uuid, null::text, null::text, 0::numeric, null::text;
    return;
  end if;

  if not coupon_row.active then
    return query select false, 'Este cupom está pausado.', coupon_row.id, coupon_row.code, coupon_row.reward_type, coupon_row.reward_value, coupon_row.reward_text;
    return;
  end if;

  if coupon_row.starts_at is not null and now() < coupon_row.starts_at then
    return query select false, 'Este cupom ainda não está disponível.', coupon_row.id, coupon_row.code, coupon_row.reward_type, coupon_row.reward_value, coupon_row.reward_text;
    return;
  end if;

  if coupon_row.expires_at is not null and now() > coupon_row.expires_at then
    return query select false, 'Este cupom expirou.', coupon_row.id, coupon_row.code, coupon_row.reward_type, coupon_row.reward_value, coupon_row.reward_text;
    return;
  end if;

  select count(*) into total_count
  from public.coupon_redemptions as r
  where r.coupon_id = coupon_row.id;

  if coupon_row.max_redemptions is not null and total_count >= coupon_row.max_redemptions then
    return query select false, 'Este cupom atingiu o limite de resgates.', coupon_row.id, coupon_row.code, coupon_row.reward_type, coupon_row.reward_value, coupon_row.reward_text;
    return;
  end if;

  select count(*) into identifier_count
  from public.coupon_redemptions as r
  where r.coupon_id = coupon_row.id and r.identifier = ident;

  if identifier_count >= coupon_row.max_redemptions_per_identifier then
    return query select false, 'Este cupom já foi resgatado o limite permitido para este identificador.', coupon_row.id, coupon_row.code, coupon_row.reward_type, coupon_row.reward_value, coupon_row.reward_text;
    return;
  end if;

  insert into public.coupon_redemptions(coupon_id, identifier)
  values (coupon_row.id, ident);

  return query
    select true, 'Cupom resgatado com sucesso.', coupon_row.id, coupon_row.code,
           coupon_row.reward_type, coupon_row.reward_value, coupon_row.reward_text;
end;
$$;

revoke all on function public.redeem_coupon(text,text) from public, anon, authenticated;
grant execute on function public.redeem_coupon(text,text) to anon, authenticated;

notify pgrst, 'reload schema';
