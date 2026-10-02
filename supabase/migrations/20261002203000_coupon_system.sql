create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  reward_type text not null default 'custom'
    check (reward_type in ('percent_discount', 'fixed_discount', 'credit', 'gift', 'custom')),
  reward_value numeric(14,2) not null default 0
    check (reward_value >= 0),
  reward_text text,
  max_redemptions integer
    check (max_redemptions is null or max_redemptions > 0),
  max_redemptions_per_identifier integer not null default 1
    check (max_redemptions_per_identifier > 0),
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  resettable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_code_normalized check (code = upper(btrim(code))),
  constraint coupons_valid_period check (
    expires_at is null or starts_at is null or expires_at > starts_at
  ),
  constraint coupons_percent_valid check (
    reward_type <> 'percent_discount' or reward_value <= 100
  )
);

create index if not exists coupons_active_period_idx
  on public.coupons(active, starts_at, expires_at);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  identifier text not null,
  redeemed_at timestamptz not null default now()
);

create index if not exists coupon_redemptions_coupon_idx
  on public.coupon_redemptions(coupon_id, redeemed_at desc);

create index if not exists coupon_redemptions_identifier_idx
  on public.coupon_redemptions(coupon_id, identifier);

create or replace function public.set_coupons_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists coupons_updated_at on public.coupons;
create trigger coupons_updated_at
before update on public.coupons
for each row execute function public.set_coupons_updated_at();

alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

revoke all on public.coupons from anon, authenticated;
revoke all on public.coupon_redemptions from anon, authenticated;
grant select, insert, update, delete on public.coupons to authenticated;
grant select, delete on public.coupon_redemptions to authenticated;

drop policy if exists "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all"
on public.coupons for all to authenticated
using ((select public.has_role(auth.uid(), 'admin')))
with check ((select public.has_role(auth.uid(), 'admin')));

drop policy if exists "coupon_redemptions_admin_select" on public.coupon_redemptions;
create policy "coupon_redemptions_admin_select"
on public.coupon_redemptions for select to authenticated
using ((select public.has_role(auth.uid(), 'admin')));

drop policy if exists "coupon_redemptions_admin_delete" on public.coupon_redemptions;
create policy "coupon_redemptions_admin_delete"
on public.coupon_redemptions for delete to authenticated
using ((select public.has_role(auth.uid(), 'admin')));

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

revoke execute on function public.set_coupons_updated_at() from public, anon, authenticated;

notify pgrst, 'reload schema';
