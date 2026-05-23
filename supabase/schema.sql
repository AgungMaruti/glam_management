-- Perfume Business Suite - Supabase Schema (Complete)

-- ─── USERS (handled by Supabase Auth) ──────────────────────────────────────
-- No custom users table needed. Use supabase.auth.users()

-- ─── RAW MATERIALS ───────────────────────────────────────────────────────────
create table if not exists raw_materials (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  unit text not null, -- ml, gram, pcs
  stock numeric not null default 0,
  min_stock numeric not null default 0,
  cost_per_unit numeric not null default 0,
  created_at timestamptz default now()
);

-- ─── PRODUCTS ──────────────────────────────────────────────────────────────
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  image_url text,
  created_at timestamptz default now()
);

-- ─── VARIANTS ───────────────────────────────────────────────────────────────
create table if not exists variants (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete cascade,
  name text not null,
  size_ml numeric not null default 0,
  selling_price numeric not null default 0,
  stock integer not null default 0,
  stock_reseller integer not null default 0,
  created_at timestamptz default now()
);

-- ─── RECIPES / BOM ───────────────────────────────────────────────────────────
create table if not exists recipes (
  id uuid default gen_random_uuid() primary key,
  variant_id uuid references variants(id) on delete cascade,
  raw_material_id uuid references raw_materials(id) on delete cascade,
  quantity_needed numeric not null,
  created_at timestamptz default now()
);

-- ─── PRODUCTIONS ────────────────────────────────────────────────────────────
create table if not exists productions (
  id uuid default gen_random_uuid() primary key,
  variant_id uuid references variants(id) on delete cascade,
  quantity integer not null,
  produced_at timestamptz default now(),
  notes text
);

-- ─── SALES ───────────────────────────────────────────────────────────────────
create table if not exists sales (
  id uuid default gen_random_uuid() primary key,
  variant_id uuid references variants(id) on delete cascade,
  quantity integer not null,
  unit_price numeric not null,
  total_amount numeric not null,
  sold_at timestamptz default now(),
  notes text
);

-- ─── RESELLERS ───────────────────────────────────────────────────────────────
create table if not exists resellers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- ─── DISTRIBUTIONS ───────────────────────────────────────────────────────────
create table if not exists distributions (
  id uuid default gen_random_uuid() primary key,
  variant_id uuid references variants(id) on delete cascade,
  reseller_id uuid references resellers(id) on delete set null,
  quantity integer not null,
  price_per_unit numeric not null default 0,
  distributed_at timestamptz default now()
);

-- ─── RESELLER PAYMENTS ───────────────────────────────────────────────────────
create table if not exists reseller_payments (
  id uuid default gen_random_uuid() primary key,
  reseller_id uuid references resellers(id) on delete cascade,
  variant_id uuid references variants(id) on delete cascade,
  quantity integer not null,
  amount numeric not null,
  paid_at timestamptz default now()
);

-- ─── CASHFLOW ─────────────────────────────────────────────────────────────────
create table if not exists cashflow (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  amount numeric not null,
  description text,
  transaction_date timestamptz default now(),
  created_at timestamptz default now()
);

-- ─── SETTINGS ─────────────────────────────────────────────────────────────────
create table if not exists settings (
  id uuid default gen_random_uuid() primary key,
  key text not null unique,
  value text not null,
  updated_at timestamptz default now()
);

-- ─── RAD (Rencana Anggaran Dana) v2 ──────────────────────────────────────────
create table if not exists rad (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  batch_quantity integer not null default 1,
  selling_price numeric not null default 0,
  salary_cost numeric not null default 0,
  other_cost numeric not null default 0,
  created_at timestamptz default now()
);

-- ─── RAD ITEMS ─────────────────────────────────────────────────────────────────
create table if not exists rad_items (
  id uuid default gen_random_uuid() primary key,
  rad_id uuid references rad(id) on delete cascade,
  name text not null,
  total_qty numeric not null default 1,
  unit text not null default 'pcs',
  total_cost numeric not null default 0,
  usage_per_bottle numeric not null default 1,
  created_at timestamptz default now()
);

-- ─── RLS ENABLE ──────────────────────────────────────────────────────────────
alter table raw_materials enable row level security;
alter table products enable row level security;
alter table variants enable row level security;
alter table recipes enable row level security;
alter table productions enable row level security;
alter table sales enable row level security;
alter table resellers enable row level security;
alter table distributions enable row level security;
alter table reseller_payments enable row level security;
alter table cashflow enable row level security;
alter table settings enable row level security;
alter table rad enable row level security;
alter table rad_items enable row level security;

-- ─── RLS POLICIES: AUTHENTICATED ONLY ─────────────────────────────────────────
-- Replace any existing "allow all" policies with authenticated-only policies

create policy "auth_all" on raw_materials for all to authenticated using (true) with check (true);
create policy "auth_all" on products for all to authenticated using (true) with check (true);
create policy "auth_all" on variants for all to authenticated using (true) with check (true);
create policy "auth_all" on recipes for all to authenticated using (true) with check (true);
create policy "auth_all" on productions for all to authenticated using (true) with check (true);
create policy "auth_all" on sales for all to authenticated using (true) with check (true);
create policy "auth_all" on resellers for all to authenticated using (true) with check (true);
create policy "auth_all" on distributions for all to authenticated using (true) with check (true);
create policy "auth_all" on reseller_payments for all to authenticated using (true) with check (true);
create policy "auth_all" on cashflow for all to authenticated using (true) with check (true);
create policy "auth_all" on settings for all to authenticated using (true) with check (true);
create policy "auth_all" on rad for all to authenticated using (true) with check (true);
create policy "auth_all" on rad_items for all to authenticated using (true) with check (true);
