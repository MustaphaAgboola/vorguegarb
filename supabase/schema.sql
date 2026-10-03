-- VogueGarb schema. Run in Supabase: SQL Editor -> New query -> Run.

create extension if not exists "pgcrypto";

-- PRODUCTS ---------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text not null default '',
  price       integer not null check (price >= 0),   -- naira
  category    text not null default 'general',
  image_url   text,
  sizes       text[] not null default '{}',
  in_stock    boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ORDERS -----------------------------------------------------------------
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending','confirmed')),
  total         integer not null check (total >= 0),
  full_name     text not null,
  phone         text not null,
  address       text not null,
  city          text not null,
  state         text not null,
  notes         text not null default '',
  email_sent_at timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id, created_at desc);

-- ORDER ITEMS ------------------------------------------------------------
create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  name       text not null,                 -- snapshot at purchase time
  unit_price integer not null,              -- snapshot at purchase time
  size       text,
  quantity   integer not null check (quantity between 1 and 20)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- CART ITEMS --------------------------------------------------------------
-- One row per (user, product, size); "" means no size was chosen.
create table if not exists public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  size       text not null default '',
  quantity   integer not null check (quantity between 1 and 20),
  created_at timestamptz not null default now(),
  unique (user_id, product_id, size)
);
create index if not exists cart_items_user_idx on public.cart_items(user_id);

-- ROW LEVEL SECURITY -----------------------------------------------------
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.cart_items  enable row level security;

create policy "products are public"
  on public.products for select using (true);

create policy "users read own orders"
  on public.orders for select using (auth.uid() = user_id);

create policy "users insert own orders"
  on public.orders for insert with check (auth.uid() = user_id);

-- Only email_sent_at may be updated by a user (see column grants below)
create policy "users update own orders"
  on public.orders for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke update on public.orders from authenticated;
grant  update (email_sent_at) on public.orders to authenticated;

create policy "users read own order items"
  on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create policy "users insert own order items"
  on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- Cart rows are private to their owner. Drop-then-create keeps this file
-- idempotent when adding cart_items to an already-created project.
drop policy if exists "users read own cart" on public.cart_items;
create policy "users read own cart"
  on public.cart_items for select using (auth.uid() = user_id);

drop policy if exists "users insert own cart" on public.cart_items;
create policy "users insert own cart"
  on public.cart_items for insert with check (auth.uid() = user_id);

drop policy if exists "users update own cart" on public.cart_items;
create policy "users update own cart"
  on public.cart_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users delete own cart" on public.cart_items;
create policy "users delete own cart"
  on public.cart_items for delete using (auth.uid() = user_id);

-- ATOMIC ORDER CREATION --------------------------------------------------
-- Prices come from the products table, never from the client.
-- SECURITY INVOKER: runs as the logged-in user, so RLS still applies.
create or replace function public.create_order(
  p_full_name text,
  p_phone     text,
  p_address   text,
  p_city      text,
  p_state     text,
  p_notes     text,
  p_items     jsonb   -- [{ "product_id": uuid, "size": text, "quantity": int }]
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_order_id uuid;
  v_total    integer;
  v_expected integer;
  v_matched  integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select count(*) into v_expected from jsonb_array_elements(p_items);

  select count(*), coalesce(sum(p.price * (i->>'quantity')::int), 0)
    into v_matched, v_total
  from jsonb_array_elements(p_items) i
  join public.products p
    on p.id = (i->>'product_id')::uuid and p.in_stock;

  if v_expected = 0 or v_matched <> v_expected then
    raise exception 'invalid or out-of-stock items';
  end if;

  insert into public.orders (user_id, total, full_name, phone, address, city, state, notes)
  values (auth.uid(), v_total, p_full_name, p_phone, p_address, p_city, p_state, coalesce(p_notes, ''))
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, name, unit_price, size, quantity)
  select v_order_id, p.id, p.name, p.price, i->>'size', (i->>'quantity')::int
  from jsonb_array_elements(p_items) i
  join public.products p on p.id = (i->>'product_id')::uuid;

  return v_order_id;
end;
$$;

grant execute on function public.create_order(text,text,text,text,text,text,jsonb) to authenticated;

-- REALTIME ----------------------------------------------------------------
-- Lets CartContext keep every tab/device in sync via postgres_changes.
do $$
begin
  alter publication supabase_realtime add table public.cart_items;
exception
  when duplicate_object then null;
end $$;
