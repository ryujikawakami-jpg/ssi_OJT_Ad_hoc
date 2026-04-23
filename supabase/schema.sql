-- =============================================================
-- ShopDemo EC Site — Database Schema (Supabase / PostgreSQL)
-- =============================================================

-- ---------------------
-- 0. Extensions
-- ---------------------
create extension if not exists "pgcrypto";

-- ---------------------
-- 1. Custom types
-- ---------------------
do $$ begin
  create type user_role    as enum ('admin', 'user');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type product_status as enum ('公開', '下書き', '入荷待');
exception when duplicate_object then null;
end $$;

-- ---------------------
-- 2. profiles
-- ---------------------
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  role        user_role not null default 'user',
  name_jp     text,
  name_kana   text,
  phone       text,
  birth_date  date,
  postal_code text,
  address     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------
-- 3. products
-- ---------------------
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  sku         text unique not null,
  name_jp     text not null,
  name_en     text,
  description text,
  price       integer not null check (price >= 0),
  stock       integer not null default 0 check (stock >= 0),
  category    text not null,
  origin      text,
  status      product_status not null default '下書き',
  tonal       char(1),
  specs       jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------
-- 4. orders
-- ---------------------
create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  order_no         text unique not null,
  user_id          uuid not null references profiles(id),
  user_name        text,
  items            jsonb not null default '[]'::jsonb,
  subtotal         integer not null default 0,
  shipping         integer not null default 0,
  discount         integer not null default 0,
  total            integer not null default 0,
  status           text not null default '処理中',
  shipping_address text,
  payment_method   text,
  created_at       timestamptz not null default now()
);

-- ---------------------
-- 5. coupons
-- ---------------------
create table if not exists coupons (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  discount_amount integer not null check (discount_amount > 0),
  active          boolean not null default true
);

-- ---------------------
-- 6. Indexes
-- ---------------------
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_status   on products(status);
create index if not exists idx_orders_user_id    on orders(user_id);
create index if not exists idx_orders_status     on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);

-- ---------------------
-- 7. updated_at trigger helper
-- ---------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ---------------------
-- 8. Auto-create profile on auth.users insert
-- ---------------------
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case
      when new.raw_user_meta_data->>'role' = 'admin' then 'admin'::user_role
      else 'user'::user_role
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop first so we can re-run this file safely
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================================
-- 9. Row Level Security
-- =============================================================

-- ---- profiles ------------------------------------------------
alter table profiles enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_select_admin" on profiles;
create policy "profiles_select_admin"
  on profiles for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_update_admin" on profiles;
create policy "profiles_update_admin"
  on profiles for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---- products ------------------------------------------------
alter table products enable row level security;

drop policy if exists "products_select_published" on products;
create policy "products_select_published"
  on products for select
  using (status = '公開');

drop policy if exists "products_select_admin" on products;
create policy "products_select_admin"
  on products for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "products_insert_admin" on products;
create policy "products_insert_admin"
  on products for insert
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "products_update_admin" on products;
create policy "products_update_admin"
  on products for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "products_delete_admin" on products;
create policy "products_delete_admin"
  on products for delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---- orders --------------------------------------------------
alter table orders enable row level security;

-- BUG #13 (INTENTIONAL): The select policy does NOT include
-- a user_id = auth.uid() check. This means any authenticated user
-- can read any order if they know the order ID (e.g. via direct URL).
drop policy if exists "orders_select_authenticated" on orders;
create policy "orders_select_authenticated"
  on orders for select
  using (auth.uid() is not null);

drop policy if exists "orders_insert_own" on orders;
create policy "orders_insert_own"
  on orders for insert
  with check (auth.uid() = user_id);

drop policy if exists "orders_update_admin" on orders;
create policy "orders_update_admin"
  on orders for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---- coupons -------------------------------------------------
alter table coupons enable row level security;

drop policy if exists "coupons_select_active" on coupons;
create policy "coupons_select_active"
  on coupons for select
  using (active = true and auth.uid() is not null);

drop policy if exists "coupons_all_admin" on coupons;
create policy "coupons_all_admin"
  on coupons for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- BUG #14: No middleware / RLS restriction prevents non-admin users
-- from accessing admin pages. This is handled (or rather NOT handled)
-- in the frontend routing layer as an intentional training bug.

-- ---------------------
-- 10. RPC: decrement_stock
-- ---------------------
create or replace function decrement_stock(p_id uuid, qty integer)
returns void as $$
begin
  update products set stock = greatest(stock - qty, 0) where id = p_id;
end;
$$ language plpgsql security definer;
