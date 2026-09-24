create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
create index if not exists messages_created_at_idx on public.messages (created_at);
create index if not exists messages_role_idx on public.messages (role);
create index if not exists conversations_created_at_idx on public.conversations (created_at);
create index if not exists conversations_user_id_idx on public.conversations (user_id);

create or replace function public.get_ai_chat_statistics(
  p_start_date timestamptz default null,
  p_end_date timestamptz default null
)
returns table (
  unique_users bigint,
  conversations_count bigint,
  user_messages bigint,
  assistant_messages bigint,
  total_messages bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with conversation_stats as (
    select count(*) as conversations_count,
           count(distinct c.user_id) as unique_users
    from public.conversations c
    where (p_start_date is null or c.created_at >= p_start_date)
      and (p_end_date is null or c.created_at < p_end_date)
  ), message_stats as (
    select count(*) filter (where m.role = 'user') as user_messages,
           count(*) filter (where m.role = 'assistant') as assistant_messages,
           count(*) as total_messages
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where (p_start_date is null or m.created_at >= p_start_date)
      and (p_end_date is null or m.created_at < p_end_date)
  )
  select conversation_stats.unique_users,
         conversation_stats.conversations_count,
         message_stats.user_messages,
         message_stats.assistant_messages,
         message_stats.total_messages
  from conversation_stats cross join message_stats;
$$;

create or replace function public.get_ai_chat_daily_statistics(
  p_start_date timestamptz default null,
  p_end_date timestamptz default null
)
returns table (
  date date,
  unique_users bigint,
  conversations_count bigint,
  user_messages bigint,
  assistant_messages bigint,
  total_messages bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with conversation_days as (
    select (c.created_at at time zone 'Asia/Baghdad')::date as date,
           count(*) as conversations_count,
           count(distinct c.user_id) as unique_users
    from public.conversations c
    where (p_start_date is null or c.created_at >= p_start_date)
      and (p_end_date is null or c.created_at < p_end_date)
    group by 1
  ), message_days as (
    select (m.created_at at time zone 'Asia/Baghdad')::date as date,
           count(*) filter (where m.role = 'user') as user_messages,
           count(*) filter (where m.role = 'assistant') as assistant_messages,
           count(*) as total_messages
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where (p_start_date is null or m.created_at >= p_start_date)
      and (p_end_date is null or m.created_at < p_end_date)
    group by 1
  )
  select coalesce(cd.date, md.date) as date,
         coalesce(cd.unique_users, 0)::bigint as unique_users,
         coalesce(cd.conversations_count, 0)::bigint as conversations_count,
         coalesce(md.user_messages, 0)::bigint as user_messages,
         coalesce(md.assistant_messages, 0)::bigint as assistant_messages,
         coalesce(md.total_messages, 0)::bigint as total_messages
  from conversation_days cd
  full join message_days md on md.date = cd.date
  order by date desc;
$$;

grant execute on function public.get_ai_chat_statistics(timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.get_ai_chat_daily_statistics(timestamptz, timestamptz) to anon, authenticated;
