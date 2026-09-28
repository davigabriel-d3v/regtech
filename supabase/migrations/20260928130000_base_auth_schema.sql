create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('admin','user');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  whatsapp text,
  criado_em timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role::text = _role
  );
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
drop policy if exists "profiles_self_insert" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_select" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "profiles_self_insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_self_update" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(), 'admin')) with check (id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "user_roles_self_select" on public.user_roles;
drop policy if exists "user_roles_admin_mutate" on public.user_roles;
create policy "user_roles_self_select" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "user_roles_admin_mutate" on public.user_roles for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, whatsapp)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), new.raw_user_meta_data->>'whatsapp')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant execute on function public.has_role(uuid,text) to anon, authenticated;

notify pgrst, 'reload schema';