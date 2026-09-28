-- Customer management: status, indexes and least-privilege admin access.
alter table public.customers
  add column if not exists status text not null default 'active'
  check (status in ('active', 'inactive'));

create index if not exists customers_status_idx on public.customers(status);
create index if not exists customers_phone_idx on public.customers(phone);
create index if not exists customers_whatsapp_idx on public.customers(whatsapp);
create index if not exists orders_customer_created_idx on public.orders(customer_id, created_at desc);

revoke select on public.customers from authenticated;
grant select (id, name, phone, whatsapp, email, status, created_at, updated_at)
  on public.customers to authenticated;
grant update (name, email, phone, whatsapp, status)
  on public.customers to authenticated;

drop policy if exists "customers_permission_select" on public.customers;
drop policy if exists "customers_permission_update" on public.customers;

create policy "customers_permission_select"
on public.customers for select to authenticated
using (public.has_permission(auth.uid(), 'clientes'));

create policy "customers_permission_update"
on public.customers for update to authenticated
using (public.has_permission(auth.uid(), 'clientes'))
with check (public.has_permission(auth.uid(), 'clientes'));

notify pgrst, 'reload schema';
