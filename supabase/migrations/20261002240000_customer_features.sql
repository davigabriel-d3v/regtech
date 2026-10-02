-- Recursos de cliente: favoritos, avaliações e notificações.
create table if not exists public.product_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, product_id)
);
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.product_favorites enable row level security;
alter table public.product_reviews enable row level security;
alter table public.user_notifications enable row level security;
create policy favorites_owner_select on public.product_favorites for select to authenticated using ((select auth.uid())=user_id);
create policy favorites_owner_insert on public.product_favorites for insert to authenticated with check ((select auth.uid())=user_id);
create policy favorites_owner_delete on public.product_favorites for delete to authenticated using ((select auth.uid())=user_id);
create policy reviews_public_select on public.product_reviews for select to public using (true);
create policy reviews_owner_insert on public.product_reviews for insert to authenticated with check ((select auth.uid())=user_id);
create policy reviews_owner_update on public.product_reviews for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy reviews_owner_delete on public.product_reviews for delete to authenticated using ((select auth.uid())=user_id);
create policy notifications_owner_select on public.user_notifications for select to authenticated using ((select auth.uid())=user_id);
create policy notifications_owner_update on public.user_notifications for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create index if not exists product_favorites_user_idx on public.product_favorites(user_id,created_at desc);
create index if not exists product_reviews_product_idx on public.product_reviews(product_id,created_at desc);
create index if not exists user_notifications_user_idx on public.user_notifications(user_id,created_at desc);

drop policy if exists orders_customer_select on public.orders;
create policy orders_customer_select on public.orders for select to authenticated using (
  exists (select 1 from public.customers c where c.id=orders.customer_id and lower(coalesce(c.email_normalized,c.email,''))=lower(coalesce((select auth.jwt()->>'email'),'')))
  or (select has_permission(auth.uid(),'pedidos'))
);
drop policy if exists order_items_customer_select on public.order_items;
create policy order_items_customer_select on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o join public.customers c on c.id=o.customer_id where o.id=order_items.order_id and lower(coalesce(c.email_normalized,c.email,''))=lower(coalesce((select auth.jwt()->>'email'),'')))
  or (select has_permission(auth.uid(),'pedidos'))
);

create or replace function public.notify_order_customer()
returns trigger language plpgsql security invoker as $$
declare v_user uuid;
begin
  select u.id into v_user from auth.users u join public.customers c
    on lower(coalesce(c.email_normalized,c.email,''))=lower(coalesce(u.email,''))
    where c.id=new.customer_id limit 1;
  if v_user is not null and (tg_op='INSERT' or old.status is distinct from new.status) then
    insert into public.user_notifications(user_id,title,message,type)
    values (v_user,
      case new.status when 'new' then 'Pedido recebido' when 'confirmed' then 'Pedido confirmado'
      when 'processing' then 'Pedido em preparação' when 'shipped' then 'Pedido enviado'
      when 'delivered' then 'Pedido entregue' when 'cancelled' then 'Pedido cancelado'
      else 'Atualização do pedido' end,
      'Seu pedido PED-' || lpad(new.order_number::text,6,'0') || ' está com status: ' || new.status || '.',
      'order');
  end if;
  return new;
end $$;
drop trigger if exists orders_notify_customer on public.orders;
create trigger orders_notify_customer after insert or update of status on public.orders
for each row execute function public.notify_order_customer();