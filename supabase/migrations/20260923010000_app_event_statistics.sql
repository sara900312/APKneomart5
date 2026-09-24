create index if not exists app_events_created_at_idx on public.app_events (created_at);
create index if not exists app_events_event_type_idx on public.app_events (event_type);
create index if not exists app_events_user_id_idx on public.app_events (user_id);
create index if not exists app_events_installation_id_idx on public.app_events (installation_id);
create index if not exists app_events_session_id_idx on public.app_events (session_id);

create or replace function public.get_app_event_statistics(
  p_start_date timestamptz default null,
  p_end_date timestamptz default null
)
returns table (
  total_events bigint,
  unique_users bigint,
  unique_installations bigint,
  unique_sessions bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select count(*) as total_events,
         count(distinct e.user_id) as unique_users,
         count(distinct e.installation_id) as unique_installations,
         count(distinct e.session_id) as unique_sessions
  from public.app_events e
  where (p_start_date is null or e.created_at >= p_start_date)
    and (p_end_date is null or e.created_at < p_end_date);
$$;

create or replace function public.get_app_event_daily_statistics(
  p_start_date timestamptz default null,
  p_end_date timestamptz default null
)
returns table (
  date date,
  total_events bigint,
  unique_users bigint,
  unique_installations bigint,
  unique_sessions bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select (e.created_at at time zone 'Asia/Baghdad')::date as date,
         count(*) as total_events,
         count(distinct e.user_id) as unique_users,
         count(distinct e.installation_id) as unique_installations,
         count(distinct e.session_id) as unique_sessions
  from public.app_events e
  where (p_start_date is null or e.created_at >= p_start_date)
    and (p_end_date is null or e.created_at < p_end_date)
  group by 1
  order by date desc;
$$;

create or replace function public.get_app_event_type_statistics(
  p_start_date timestamptz default null,
  p_end_date timestamptz default null
)
returns table (
  event_type text,
  total_events bigint,
  unique_users bigint,
  unique_installations bigint,
  unique_sessions bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select e.event_type,
         count(*) as total_events,
         count(distinct e.user_id) as unique_users,
         count(distinct e.installation_id) as unique_installations,
         count(distinct e.session_id) as unique_sessions
  from public.app_events e
  where (p_start_date is null or e.created_at >= p_start_date)
    and (p_end_date is null or e.created_at < p_end_date)
  group by e.event_type
  order by total_events desc, e.event_type asc;
$$;

grant execute on function public.get_app_event_statistics(timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.get_app_event_daily_statistics(timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.get_app_event_type_statistics(timestamptz, timestamptz) to anon, authenticated;
