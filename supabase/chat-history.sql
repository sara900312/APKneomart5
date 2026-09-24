create extension if not exists "pgcrypto";

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  hidden_from_recent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) > 0),
  created_at timestamptz not null default now()
);

alter table public.conversations
  add column if not exists hidden_from_recent boolean not null default false;

create index if not exists conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc);

create index if not exists conversations_recent_searches_idx
  on public.conversations (user_id, hidden_from_recent, updated_at desc);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at asc);

create index if not exists messages_user_created_idx
  on public.messages (user_id, created_at asc);

create or replace function public.set_conversations_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_conversations_updated_at();

create or replace function public.update_conversation_activity()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_update_conversation_activity on public.messages;
create trigger messages_update_conversation_activity
after insert on public.messages
for each row execute function public.update_conversation_activity();

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Users can view their conversations" on public.conversations;
create policy "Users can view their conversations"
on public.conversations for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their conversations" on public.conversations;
create policy "Users can create their conversations"
on public.conversations for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their conversations" on public.conversations;
create policy "Users can update their conversations"
on public.conversations for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their conversations" on public.conversations;
create policy "Users can delete their conversations"
on public.conversations for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view their messages" on public.messages;
create policy "Users can view their messages"
on public.messages for select
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Users can create their messages" on public.messages;
create policy "Users can create their messages"
on public.messages for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete their messages" on public.messages;
create policy "Users can delete their messages"
on public.messages for delete
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and c.user_id = auth.uid()
  )
);
