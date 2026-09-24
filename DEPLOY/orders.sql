-- Deploy this in Supabase SQL Editor for project emobathinfpylwjdcfbo
-- Creates the orders table needed by NEO AI checkout.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  customer_name text not null,
  customer_phone text not null,
  governorate text,
  area text,
  landmark text,
  notes text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  shipping numeric not null default 0,
  total numeric not null default 0,
  payment_method text not null default 'cod',
  order_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index if not exists orders_phone_idx on public.orders (customer_phone);
create index if not exists orders_code_idx on public.orders (order_code);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_phone_delivered_idx
  on public.orders (customer_phone, delivered_at, id)
  where order_status = 'delivered';

-- Data API grants (required — PostgREST does not grant by default)
grant select, insert on public.orders to anon;
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;

alter table public.orders enable row level security;

drop policy if exists "public read orders" on public.orders;
create policy "public read orders" on public.orders
  for select using (true);

drop policy if exists "public insert orders" on public.orders;
create policy "public insert orders" on public.orders
  for insert with check (true);

-- Realtime for live status updates in the app
alter publication supabase_realtime add table public.orders;

create or replace function public.set_orders_timestamps()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();

  if tg_op = 'INSERT' then
    if new.order_status = 'delivered' then
      new.delivered_at = coalesce(new.delivered_at, now());
    end if;
    return new;
  end if;

  if old.delivered_at is not null then
    new.delivered_at = old.delivered_at;
  elsif new.order_status = 'delivered'
    and old.order_status is distinct from 'delivered' then
    new.delivered_at = now();
  else
    new.delivered_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_updated_at on public.orders;
drop trigger if exists trg_orders_timestamps on public.orders;
create trigger trg_orders_timestamps before insert or update on public.orders
for each row execute function public.set_orders_timestamps();

create or replace function public.set_orders_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
