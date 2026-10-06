alter table public.shop_settings
  add column if not exists store_name text not null default 'RegTech',
  add column if not exists support_email text,
  add column if not exists support_phone text,
  add column if not exists store_city text default 'Tucumã - PA',
  add column if not exists order_message text default 'Olá! Quero fazer um pedido pela RegTech.',
  add column if not exists public_store_enabled boolean not null default true,
  add column if not exists maintenance_message text,
  add column if not exists updated_by uuid references auth.users(id);

insert into public.shop_settings (id, store_name, public_store_enabled)
values ('default', 'RegTech', true)
on conflict (id) do nothing;