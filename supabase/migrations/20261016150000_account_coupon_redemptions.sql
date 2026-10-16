alter table public.coupons
  add column if not exists redemption_cycle integer not null default 1;

alter table public.coupon_redemptions
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists redemption_cycle integer not null default 1;

-- Keep historical anonymous redemptions out of the new account-bound cycle.
update public.coupon_redemptions set redemption_cycle = 0 where user_id is null;

create index if not exists coupon_redemptions_user_idx
  on public.coupon_redemptions(user_id, redeemed_at desc);

create unique index if not exists coupon_redemptions_user_cycle_uidx
  on public.coupon_redemptions(coupon_id, user_id, redemption_cycle)
  where user_id is not null;

drop policy if exists "coupon_redemptions_user_select" on public.coupon_redemptions;
create policy "coupon_redemptions_user_select"
on public.coupon_redemptions for select to authenticated
using (user_id = auth.uid() or (select public.has_role(auth.uid(), 'admin')));

create or replace function public.redeem_coupon(
  p_code text,
  p_identifier text default null
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
  c public.coupons%rowtype;
  current_user_id uuid := auth.uid();
  ident text;
  total_count integer;
  user_count integer;
begin
  if current_user_id is null then
    return query select false, 'Entre na sua conta para resgatar um cupom.', null::uuid, null::text, null::text, 0::numeric, null::text;
    return;
  end if;

  ident := lower(coalesce(auth.jwt() ->> 'email', current_user_id::text));

  if btrim(coalesce(p_code, '')) = '' then
    return query select false, 'Informe o cupom.', null::uuid, null::text, null::text, 0::numeric, null::text;
    return;
  end if;

  select cp.* into c
  from public.coupons cp
  where cp.code = upper(btrim(p_code))
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
  from public.coupon_redemptions r
  where r.coupon_id = c.id and r.redemption_cycle = c.redemption_cycle;

  if c.max_redemptions is not null and total_count >= c.max_redemptions then
    return query select false, 'Este cupom atingiu o limite de resgates.', c.id, c.code, c.reward_type, c.reward_value, c.reward_text;
    return;
  end if;

  select count(*) into user_count
  from public.coupon_redemptions r
  where r.coupon_id = c.id
    and r.user_id = current_user_id
    and r.redemption_cycle = c.redemption_cycle;

  if user_count >= c.max_redemptions_per_identifier then
    return query select false, 'Você já resgatou este cupom neste ciclo.', c.id, c.code, c.reward_type, c.reward_value, c.reward_text;
    return;
  end if;

  insert into public.coupon_redemptions(coupon_id, identifier, user_id, redemption_cycle)
  values (c.id, ident, current_user_id, c.redemption_cycle);

  return query select true, 'Cupom resgatado com sucesso.', c.id, c.code, c.reward_type, c.reward_value, c.reward_text;
exception when unique_violation then
  return query select false, 'Você já resgatou este cupom neste ciclo.', null::uuid, null::text, null::text, 0::numeric, null::text;
end;
$$;

revoke all on function public.redeem_coupon(text,text) from public, anon, authenticated;
grant execute on function public.redeem_coupon(text,text) to authenticated;

create or replace function public.reset_coupon_redemptions(p_coupon_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_cycle integer;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin') then
    raise exception 'Apenas administradores podem resetar cupons.';
  end if;

  update public.coupons
  set redemption_cycle = redemption_cycle + 1
  where id = p_coupon_id and resettable = true
  returning redemption_cycle into next_cycle;

  if next_cycle is null then
    raise exception 'Cupom não encontrado ou configurado para não permitir reset.';
  end if;

  return next_cycle;
end;
$$;

revoke all on function public.reset_coupon_redemptions(uuid) from public, anon, authenticated;
grant execute on function public.reset_coupon_redemptions(uuid) to authenticated;

create or replace function public.get_my_coupon_redemptions()
returns table (
  id uuid,
  redeemed_at timestamptz,
  redemption_cycle integer,
  coupon_id uuid,
  code text,
  name text,
  description text,
  reward_type text,
  reward_value numeric,
  reward_text text,
  current_redemption_cycle integer
)
language sql
security definer
stable
set search_path = public
as $$
  select r.id, r.redeemed_at, r.redemption_cycle, c.id, c.code, c.name,
         c.description, c.reward_type, c.reward_value, c.reward_text, c.redemption_cycle
  from public.coupon_redemptions r
  join public.coupons c on c.id = r.coupon_id
  where r.user_id = auth.uid()
  order by r.redeemed_at desc;
$$;

revoke all on function public.get_my_coupon_redemptions() from public, anon;
grant execute on function public.get_my_coupon_redemptions() to authenticated;

notify pgrst, 'reload schema';
