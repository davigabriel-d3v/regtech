create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_customers_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role::text = _role
  );
$$;

create or replace function public.has_permission(p_user_id uuid, p_module text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(p_user_id, 'admin')
    or exists (
      select 1 from public.access_permissions ap
      where ap.user_id = p_user_id and ap.module = p_module and ap.enabled
    );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome, whatsapp)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), new.raw_user_meta_data->>'whatsapp')
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.has_role(uuid,text) from public, anon;
grant execute on function public.has_role(uuid,text) to authenticated;
revoke execute on function public.has_permission(uuid,text) from public, anon;
grant execute on function public.has_permission(uuid,text) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

notify pgrst, 'reload schema';