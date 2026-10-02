create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('purchase','sale','adjustment','return','loss','reservation','reservation_release')),
  quantity integer not null check (quantity <> 0),
  stock_before integer not null check (stock_before >= 0),
  stock_after integer not null check (stock_after >= 0),
  reason text,
  reference_type text,
  reference_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists inventory_movements_product_idx on public.inventory_movements(product_id, created_at desc);
create index if not exists inventory_movements_type_idx on public.inventory_movements(movement_type, created_at desc);
create index if not exists inventory_movements_reference_idx on public.inventory_movements(reference_type, reference_id);
alter table public.inventory_movements enable row level security;
revoke all on public.inventory_movements from anon, authenticated;
grant select on public.inventory_movements to authenticated;
drop policy if exists "inventory_movements_permission_select" on public.inventory_movements;
create policy "inventory_movements_permission_select" on public.inventory_movements for select to authenticated using (public.has_permission(auth.uid(), 'estoque'));

create or replace function public.record_inventory_movement()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if old.stock is distinct from new.stock then
    insert into public.inventory_movements(product_id,movement_type,quantity,stock_before,stock_after,created_by)
    values(new.id,'adjustment',new.stock-old.stock,old.stock,new.stock,auth.uid());
  end if;
  return new;
end; $$;
drop trigger if exists products_inventory_movement on public.products;
create trigger products_inventory_movement after update of stock on public.products for each row execute function public.record_inventory_movement();

create or replace function public.adjust_product_stock(p_product_id uuid,p_delta integer,p_movement_type text default 'adjustment',p_reason text default null)
returns public.products language plpgsql security definer set search_path=''
as $$
declare v_product public.products%rowtype;
begin
  if not public.has_permission((select auth.uid()),'estoque') then raise exception 'Sem permissão para movimentar estoque'; end if;
  if p_product_id is null or p_delta is null or p_delta=0 then raise exception 'Movimentação inválida'; end if;
  if p_movement_type not in ('purchase','sale','adjustment','return','loss') then raise exception 'Tipo de movimentação inválido'; end if;
  select * into v_product from public.products where id=p_product_id for update;
  if not found then raise exception 'Produto não encontrado'; end if;
  if v_product.stock+p_delta<0 then raise exception 'Estoque insuficiente'; end if;
  update public.products set stock=stock+p_delta where id=p_product_id returning * into v_product;
  update public.inventory_movements set movement_type=p_movement_type,reason=p_reason
    where id=(select id from public.inventory_movements where product_id=p_product_id and stock_before=v_product.stock-p_delta and stock_after=v_product.stock and created_by=auth.uid() order by created_at desc limit 1);
  return v_product;
end; $$;
revoke all on function public.adjust_product_stock(uuid,integer,text,text) from public,anon;
grant execute on function public.adjust_product_stock(uuid,integer,text,text) to authenticated;

create or replace function public.create_public_order(p_product_id uuid,p_quantity integer,p_customer jsonb,p_notes text default null,p_selected_variation jsonb default null)
returns table(order_id uuid,order_number bigint,order_number_display text)
language plpgsql security definer set search_path=''
as $$
declare v_product public.products%rowtype; v_image text; v_customer_id uuid; v_phone text; v_email text; v_name text; v_order_id uuid; v_order_number bigint; v_email_normalized text;
begin
  if p_product_id is null then raise exception 'Produto inválido'; end if;
  if p_quantity is null or p_quantity<1 or p_quantity>999 then raise exception 'Quantidade inválida'; end if;
  if p_customer is null or jsonb_typeof(p_customer)<>'object' then raise exception 'Dados do cliente inválidos'; end if;
  v_name:=btrim(coalesce(p_customer->>'name','')); v_phone:=regexp_replace(coalesce(p_customer->>'phone',''),'[^0-9+]','','g'); v_email:=lower(btrim(coalesce(p_customer->>'email',''))); v_email_normalized:=nullif(v_email,'');
  if length(v_name)<2 or length(v_name)>120 then raise exception 'Nome inválido'; end if;
  if length(v_phone)<8 or length(v_phone)>20 then raise exception 'Telefone inválido'; end if;
  if v_email_normalized is not null and v_email_normalized !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'E-mail inválido'; end if;
  select * into v_product from public.products where id=p_product_id and status='active' for update;
  if not found then raise exception 'Produto não disponível'; end if;
  if v_product.stock<p_quantity then raise exception 'Quantidade indisponível em estoque'; end if;
  select pi.image_url into v_image from public.product_images pi where pi.product_id=v_product.id order by pi.is_primary desc,pi.display_order asc limit 1;
  select c.id into v_customer_id from public.customers c where c.phone_normalized=v_phone limit 1;
  if v_customer_id is null and v_email_normalized is not null then select c.id into v_customer_id from public.customers c where c.email_normalized=v_email_normalized limit 1; end if;
  if v_customer_id is null then
    insert into public.customers(name,phone,phone_normalized,whatsapp,email,email_normalized) values(v_name,btrim(coalesce(p_customer->>'phone','')),v_phone,nullif(btrim(coalesce(p_customer->>'whatsapp','')),''),nullif(btrim(coalesce(p_customer->>'email','')),''),v_email_normalized) returning id into v_customer_id;
  else
    update public.customers set name=v_name,phone=btrim(coalesce(p_customer->>'phone','')),whatsapp=nullif(btrim(coalesce(p_customer->>'whatsapp','')),''),email=nullif(btrim(coalesce(p_customer->>'email','')),''),email_normalized=v_email_normalized where id=v_customer_id;
  end if;
  update public.products set stock=stock-p_quantity where id=v_product.id;
  insert into public.orders(customer_id,status,notes) values(v_customer_id,'new',nullif(btrim(coalesce(p_notes,'')),'')) returning public.orders.id,public.orders.order_number into v_order_id,v_order_number;
  insert into public.order_items(order_id,product_id,product_code,product_name,product_image,product_sku,quantity,selected_variation) values(v_order_id,v_product.id,v_product.product_code,v_product.name,v_image,v_product.sku,p_quantity,p_selected_variation);
  update public.inventory_movements set movement_type='reservation',reference_type='order',reference_id=v_order_id,reason='Reserva automática do pedido'
    where id=(select id from public.inventory_movements where product_id=v_product.id and stock_before=v_product.stock and stock_after=v_product.stock-p_quantity order by created_at desc limit 1);
  return query select v_order_id,v_order_number,'PED-'||lpad(v_order_number::text,6,'0');
end; $$;
revoke all on function public.create_public_order(uuid,integer,jsonb,text,jsonb) from public;
grant execute on function public.create_public_order(uuid,integer,jsonb,text,jsonb) to anon,authenticated;

create or replace function public.sync_order_inventory_on_status()
returns trigger language plpgsql security definer set search_path=''
as $$
declare item_row record; v_product public.products%rowtype;
begin
  if old.status is distinct from new.status and new.status='cancelled' then
    for item_row in select oi.product_id,oi.quantity from public.order_items oi where oi.order_id=new.id loop
      update public.products set stock=stock+item_row.quantity where id=item_row.product_id returning * into v_product;
      if not found then raise exception 'Produto do pedido não encontrado'; end if;
      update public.inventory_movements set movement_type='reservation_release',reference_type='order',reference_id=new.id,reason='Liberação de estoque por cancelamento'
      where id=(select im.id from public.inventory_movements im where im.product_id=item_row.product_id and im.reference_type='order' and im.reference_id=new.id and im.movement_type='reservation' order by im.created_at desc limit 1);
    end loop;
  elsif old.status='cancelled' and new.status<>'cancelled' then
    for item_row in select oi.product_id,oi.quantity from public.order_items oi where oi.order_id=new.id loop
      update public.products set stock=stock-item_row.quantity where id=item_row.product_id and stock>=item_row.quantity returning * into v_product;
      if not found then raise exception 'Estoque insuficiente para reabrir o pedido'; end if;
      update public.inventory_movements set movement_type='reservation',reference_type='order',reference_id=new.id,reason='Reserva novamente após reabertura do pedido'
      where id=(select im.id from public.inventory_movements im where im.product_id=item_row.product_id and im.reference_type='order' and im.reference_id=new.id and im.movement_type='reservation_release' order by im.created_at desc limit 1);
    end loop;
  end if;
  return new;
end; $$;
drop trigger if exists orders_inventory_sync on public.orders;
create trigger orders_inventory_sync after update of status on public.orders for each row execute function public.sync_order_inventory_on_status();
revoke execute on function public.sync_order_inventory_on_status() from public,anon;
grant execute on function public.sync_order_inventory_on_status() to authenticated;
notify pgrst,'reload schema';