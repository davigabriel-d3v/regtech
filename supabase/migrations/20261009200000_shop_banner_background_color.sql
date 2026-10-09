alter table public.shop_banners
  add column if not exists background_color text not null default '#073b8c';

update public.shop_banners
set background_color = '#073b8c'
where background_color is null or background_color = '';
