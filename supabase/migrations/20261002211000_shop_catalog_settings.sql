
alter table public.products
  add column if not exists catalog_featured boolean not null default false,
  add column if not exists catalog_order integer not null default 0;

create index if not exists products_catalog_featured_order_idx
  on public.products(catalog_featured desc, catalog_order asc, created_at desc);

create table if not exists public.shop_settings (
  id text primary key default 'default',
  whatsapp_phone text not null default '5594992989833',
  offers_enabled boolean not null default true,
  offers_title text not null default 'Ofertas do dia',
  offers_subtitle text,
  offers_limit integer not null default 8 check (offers_limit between 1 and 24),
  featured_enabled boolean not null default true,
  featured_title text not null default 'Destaques da RegTech',
  featured_subtitle text,
  featured_limit integer not null default 8 check (featured_limit between 1 and 24),
  updated_at timestamptz not null default now()
);

insert into public.shop_settings (id)
values ('default')
on conflict (id) do nothing;

create or replace function public.set_shop_settings_updated_at()
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

drop trigger if exists shop_settings_updated_at on public.shop_settings;
create trigger shop_settings_updated_at
before update on public.shop_settings
for each row execute function public.set_shop_settings_updated_at();

alter table public.shop_settings enable row level security;
revoke all on public.shop_settings from anon, authenticated;
grant select on public.shop_settings to anon, authenticated;
grant insert, update, delete on public.shop_settings to authenticated;

drop policy if exists "shop_settings_public_read" on public.shop_settings;
create policy "shop_settings_public_read"
on public.shop_settings for select
to anon, authenticated
using (true);

drop policy if exists "shop_settings_admin_write" on public.shop_settings;
create policy "shop_settings_admin_write"
on public.shop_settings for all
to authenticated
using ((select public.has_role(auth.uid(), 'admin')))
with check ((select public.has_role(auth.uid(), 'admin')));

notify pgrst, 'reload schema';
