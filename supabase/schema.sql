-- Perfume Business Suite - Supabase Schema

-- Raw Materials (Bahan Baku)
create table if not exists raw_materials (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  unit text not null, -- ml, gram, pcs
  stock numeric not null default 0,
  min_stock numeric not null default 0, -- alert threshold
  cost_per_unit numeric not null default 0,
  created_at timestamptz default now()
);

-- Products (Varian Parfum)
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  image_url text,
  created_at timestamptz default now()
);

-- Product Variants
create table if not exists variants (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete cascade,
  name text not null,
  size_ml numeric not null default 0,
  selling_price numeric not null default 0,
  stock integer not null default 0,
  created_at timestamptz default now()
);

-- Recipe / Bill of Materials per Variant
create table if not exists recipes (
  id uuid default gen_random_uuid() primary key,
  variant_id uuid references variants(id) on delete cascade,
  raw_material_id uuid references raw_materials(id) on delete cascade,
  quantity_needed numeric not null, -- per 1 bottle
  created_at timestamptz default now()
);

-- Production Batches
create table if not exists productions (
  id uuid default gen_random_uuid() primary key,
  variant_id uuid references variants(id) on delete cascade,
  quantity integer not null,
  produced_at timestamptz default now(),
  notes text
);

-- Sales
create table if not exists sales (
  id uuid default gen_random_uuid() primary key,
  variant_id uuid references variants(id) on delete cascade,
  quantity integer not null,
  unit_price numeric not null,
  total_amount numeric not null,
  sold_at timestamptz default now(),
  notes text
);

-- RAD (Rencana Anggaran Dana)
create table if not exists rad (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  batch_quantity integer not null default 1,
  bibit_cost numeric not null default 0,
  absolut_cost numeric not null default 0,
  bottle_cost numeric not null default 0,
  sticker_cost numeric not null default 0,
  box_cost numeric not null default 0,
  other_cost numeric not null default 0,
  hpp_per_unit numeric generated always as (
    (bibit_cost + absolut_cost + bottle_cost + sticker_cost + box_cost + other_cost) / batch_quantity
  ) stored,
  margin_30 numeric generated always as (
    ((bibit_cost + absolut_cost + bottle_cost + sticker_cost + box_cost + other_cost) / batch_quantity) * 1.3
  ) stored,
  margin_50 numeric generated always as (
    ((bibit_cost + absolut_cost + bottle_cost + sticker_cost + box_cost + other_cost) / batch_quantity) * 1.5
  ) stored,
  margin_100 numeric generated always as (
    ((bibit_cost + absolut_cost + bottle_cost + sticker_cost + box_cost + other_cost) / batch_quantity) * 2.0
  ) stored,
  created_at timestamptz default now()
);

-- Cashflow
create table if not exists cashflow (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('income', 'expense')),
  category text not null, -- penjualan, marketing, operasional, dll
  amount numeric not null,
  description text,
  transaction_date timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable RLS (but allow all since no auth)
alter table raw_materials enable row level security;
alter table products enable row level security;
alter table variants enable row level security;
alter table recipes enable row level security;
alter table productions enable row level security;
alter table sales enable row level security;
alter table rad enable row level security;
alter table cashflow enable row level security;

-- Allow all operations (no auth)
create policy "allow all" on raw_materials for all using (true) with check (true);
create policy "allow all" on products for all using (true) with check (true);
create policy "allow all" on variants for all using (true) with check (true);
create policy "allow all" on recipes for all using (true) with check (true);
create policy "allow all" on productions for all using (true) with check (true);
create policy "allow all" on sales for all using (true) with check (true);
create policy "allow all" on rad for all using (true) with check (true);
create policy "allow all" on cashflow for all using (true) with check (true);

-- Seed sample raw materials
insert into raw_materials (name, unit, stock, min_stock, cost_per_unit) values
  ('Bibit Parfum', 'ml', 1000, 100, 500),
  ('Absolut/Alkohol', 'ml', 2000, 200, 50),
  ('Botol 30ml', 'pcs', 50, 10, 8000),
  ('Stiker', 'pcs', 100, 20, 500),
  ('Box', 'pcs', 50, 10, 3000);
