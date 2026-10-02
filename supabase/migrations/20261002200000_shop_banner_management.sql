create table if not exists public.shop_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  badge text not null default 'RegTech Shop',
  button_label text not null default 'Comprar agora',
  action_type text not null default 'section'
    check (action_type in ('section', 'url', 'none')),
  action_value text,
  icon_name text not null default 'Tag',
  background_image_url text,
  background_mobile_image_url text,
  overlay_opacity numeric(3,2) not null default 0.35
    check (overlay_opacity >= 0 and overlay_opacity <= 1),
  text_align text not null default 'left'
    check (text_align in ('left', 'center', 'right')),
  active boolean not null default true,
  display_order integer not null default 0
    check (display_order >= 0),
  autoplay_seconds integer not null default 5
    check (autoplay_seconds between 2 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_banners_active_order_idx
  on public.shop_banners(active, display_order);

create or replace function public.set_shop_banners_updated_at()
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

drop trigger if exists shop_banners_updated_at on public.shop_banners;
create trigger shop_banners_updated_at
before update on public.shop_banners
for each row execute function public.set_shop_banners_updated_at();

alter table public.shop_banners enable row level security;

revoke all on public.shop_banners from anon, authenticated;
grant select on public.shop_banners to anon, authenticated;
grant insert, update, delete on public.shop_banners to authenticated;

drop policy if exists "shop_banners_public_select" on public.shop_banners;
create policy "shop_banners_public_select"
on public.shop_banners for select to anon, authenticated
using (active = true or (select public.has_role(auth.uid(), 'admin')));

drop policy if exists "shop_banners_admin_insert" on public.shop_banners;
create policy "shop_banners_admin_insert"
on public.shop_banners for insert to authenticated
with check ((select public.has_role(auth.uid(), 'admin')));

drop policy if exists "shop_banners_admin_update" on public.shop_banners;
create policy "shop_banners_admin_update"
on public.shop_banners for update to authenticated
using ((select public.has_role(auth.uid(), 'admin')))
with check ((select public.has_role(auth.uid(), 'admin')));

drop policy if exists "shop_banners_admin_delete" on public.shop_banners;
create policy "shop_banners_admin_delete"
on public.shop_banners for delete to authenticated
using ((select public.has_role(auth.uid(), 'admin')));

insert into public.shop_banners (
  title, subtitle, badge, button_label, action_type, action_value, icon_name, display_order
)
select *
from (
  values
    ('Ofertas que cabem no seu bolso', 'Os melhores produtos com condições especiais.', 'RegTech Shop', 'Ver ofertas', 'section', 'ofertas', 'Tag', 0),
    ('Smartphones com suporte RegTech', 'Apple, Samsung, Xiaomi e Realme configurados para você.', 'RegTech Shop', 'Comprar agora', 'section', 'celulares', 'Smartphone', 1),
    ('Internet Starlink onde você estiver', 'Instalação completa em Tucumã e Ourilândia.', 'RegTech Shop', 'Comprar agora', 'section', 'informatica', 'SatelliteDish', 2),
    ('Mobilidade elétrica e drones', 'Motos elétricas e DJI com orientação especializada.', 'RegTech Shop', 'Comprar agora', 'section', 'eletronicos', 'Bike', 3)
) as seed(title, subtitle, badge, button_label, action_type, action_value, icon_name, display_order)
where not exists (select 1 from public.shop_banners);

insert into storage.buckets (id, name, public)
values ('shop-banners', 'shop-banners', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "shop banners public read" on storage.objects;
create policy "shop banners public read"
on storage.objects for select
using (bucket_id = 'shop-banners');

drop policy if exists "shop banners admin insert" on storage.objects;
create policy "shop banners admin insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'shop-banners' and (select public.has_role(auth.uid(), 'admin')));

drop policy if exists "shop banners admin update" on storage.objects;
create policy "shop banners admin update"
on storage.objects for update to authenticated
using (bucket_id = 'shop-banners' and (select public.has_role(auth.uid(), 'admin')))
with check (bucket_id = 'shop-banners' and (select public.has_role(auth.uid(), 'admin')));

drop policy if exists "shop banners admin delete" on storage.objects;
create policy "shop banners admin delete"
on storage.objects for delete to authenticated
using (bucket_id = 'shop-banners' and (select public.has_role(auth.uid(), 'admin')));

revoke execute on function public.set_shop_banners_updated_at() from public, anon, authenticated;
notify pgrst, 'reload schema';
