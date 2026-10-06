create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'open' check (status in ('open','closed')),
  subject text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer','admin')),
  message text,
  attachment_url text,
  attachment_name text,
  attachment_type text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists chat_conversations_user_idx on public.chat_conversations(user_id, updated_at desc);
create index if not exists chat_messages_conversation_idx on public.chat_messages(conversation_id, created_at);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "chat conversations own select" on public.chat_conversations;
create policy "chat conversations own select" on public.chat_conversations for select to authenticated using (user_id = (select auth.uid()) or has_role((select auth.uid()), 'admin') or has_permission((select auth.uid()), 'chat'));

drop policy if exists "chat conversations own insert" on public.chat_conversations;
create policy "chat conversations own insert" on public.chat_conversations for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "chat conversations own update" on public.chat_conversations;
create policy "chat conversations own update" on public.chat_conversations for update to authenticated using (user_id = (select auth.uid()) or has_role((select auth.uid()), 'admin') or has_permission((select auth.uid()), 'chat')) with check (user_id = (select auth.uid()) or has_role((select auth.uid()), 'admin') or has_permission((select auth.uid()), 'chat'));

drop policy if exists "chat messages participant select" on public.chat_messages;
create policy "chat messages participant select" on public.chat_messages for select to authenticated using (sender_id = (select auth.uid()) or exists (select 1 from public.chat_conversations c where c.id = conversation_id and (c.user_id = (select auth.uid()) or has_role((select auth.uid()), 'admin') or has_permission((select auth.uid()), 'chat'))));

drop policy if exists "chat messages participant insert" on public.chat_messages;
create policy "chat messages participant insert" on public.chat_messages for insert to authenticated with check (sender_id = (select auth.uid()) and ((sender_role = 'customer' and exists (select 1 from public.chat_conversations c where c.id = conversation_id and c.user_id = (select auth.uid()))) or (sender_role = 'admin' and (has_role((select auth.uid()), 'admin') or has_permission((select auth.uid()), 'chat')))));

drop policy if exists "chat messages read update" on public.chat_messages;
create policy "chat messages read update" on public.chat_messages for update to authenticated using (sender_id = (select auth.uid()) or exists (select 1 from public.chat_conversations c where c.id = conversation_id and (c.user_id = (select auth.uid()) or has_role((select auth.uid()), 'admin') or has_permission((select auth.uid()), 'chat')))) with check (sender_id = (select auth.uid()) or exists (select 1 from public.chat_conversations c where c.id = conversation_id and (c.user_id = (select auth.uid()) or has_role((select auth.uid()), 'admin') or has_permission((select auth.uid()), 'chat'))));

create or replace function public.touch_chat_conversation()
returns trigger language plpgsql security invoker set search_path = public
as $$ begin update public.chat_conversations set updated_at = now(), last_message_at = now() where id = new.conversation_id; return new; end; $$;

drop trigger if exists trg_touch_chat_conversation on public.chat_messages;
create trigger trg_touch_chat_conversation after insert on public.chat_messages for each row execute function public.touch_chat_conversation();

insert into storage.buckets (id, name, public) values ('chat-attachments', 'chat-attachments', true) on conflict (id) do nothing;

drop policy if exists "chat attachments public read" on storage.objects;
create policy "chat attachments public read" on storage.objects for select to public using (bucket_id = 'chat-attachments');

drop policy if exists "chat attachments authenticated upload" on storage.objects;
create policy "chat attachments authenticated upload" on storage.objects for insert to authenticated with check (bucket_id = 'chat-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "chat attachments own update" on storage.objects;
create policy "chat attachments own update" on storage.objects for update to authenticated using (bucket_id = 'chat-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'chat-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "chat attachments own delete" on storage.objects;
create policy "chat attachments own delete" on storage.objects for delete to authenticated using (bucket_id = 'chat-attachments' and ((storage.foldername(name))[1] = (select auth.uid())::text or has_role((select auth.uid()), 'admin') or has_permission((select auth.uid()), 'chat')));

alter table public.chat_conversations replica identity full;
alter table public.chat_messages replica identity full;