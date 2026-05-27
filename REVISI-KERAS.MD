BLUEPRINT: GLAM MANAGEMENT V2
PRE-EXECUTION CHECKLIST
Sebelum mulai, pastikan dulu:
[ ] Supabase project sudah running
[ ] Email Auth sudah enabled di Supabase
[ ] .env.local isinya NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY valid
[ ] npm install (pastikan semua dependency terinstall)
[ ] Semua file migrate lama di folder supabase/ sudah kamu backup (akan dihapus)
STEP 1: supabase/init.sql
Hapus semua file di folder supabase/ lalu buat 1 file supabase/init.sql. Lalu jalankan di Supabase SQL Editor.
Isinya:
-- ═══════════════════════════════════════════════════════════
-- GLAM MANAGEMENT V2 — Clean Database Schema
-- Copy & run this ENTIRE file in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════
-- ─── DROP ALL EXISTING TABLES ───────────────────────────────
drop table if exists rad_items cascade;
drop table if exists rad cascade;
drop table if exists stock_movements cascade;
drop table if exists reseller_payments cascade;
drop table if exists distributions cascade;
drop table if exists resellers cascade;
drop table if exists sales cascade;
drop table if exists productions cascade;
drop table if exists recipes cascade;
drop table if exists variants cascade;
drop table if exists products cascade;
drop table if exists cashflow cascade;
drop table if exists initial_balance cascade;
drop table if exists settings cascade;
drop table if exists raw_materials cascade;
drop table if exists metrics cascade;
-- ─── 1. MASTER DATA ────────────────────────────────────────
create table raw_materials (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid default auth.uid() references auth.users(id) on delete cascade not null,
  name          text not null,
  unit          text not null,
  stock         numeric not null default 0,
  min_stock     numeric not null default 0,
  cost_per_unit numeric not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create table products (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid default auth.uid() references auth.users(id) on delete cascade not null,
  name        text not null,
  description text,
  image_url   text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create table variants (
  id              uuid default gen_random_uuid() primary key,
  product_id      uuid references products(id) on delete cascade not null,
  user_id         uuid default auth.uid() references auth.users(id) on delete cascade not null,
  name            text not null,
  size_ml         numeric not null default 0,
  selling_price   numeric not null default 0,
  stock_own       integer not null default 0,
  stock_reseller  integer not null default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create table recipes (
  id               uuid default gen_random_uuid() primary key,
  variant_id       uuid references variants(id) on delete cascade not null,
  raw_material_id  uuid references raw_materials(id) on delete cascade not null,
  user_id          uuid default auth.uid() references auth.users(id) on delete cascade not null,
  quantity_needed  numeric not null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create table resellers (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid default auth.uid() references auth.users(id) on delete cascade not null,
  name       text not null,
  contact    text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- ─── 2. TRANSAKSI / OPERASIONAL ────────────────────────────
create table productions (
  id          uuid default gen_random_uuid() primary key,
  variant_id  uuid references variants(id) on delete cascade not null,
  user_id     uuid default auth.uid() references auth.users(id) on delete cascade not null,
  quantity    integer not null,
  total_cost  numeric not null default 0,
  produced_at timestamptz default now(),
  notes       text
);
create table sales (
  id           uuid default gen_random_uuid() primary key,
  variant_id   uuid references variants(id) on delete cascade not null,
  user_id      uuid default auth.uid() references auth.users(id) on delete cascade not null,
  quantity     integer not null,
  unit_price   numeric not null,
  total_amount numeric not null,
  sold_at      timestamptz default now(),
  notes        text
);
create table distributions (
  id              uuid default gen_random_uuid() primary key,
  variant_id      uuid references variants(id) on delete cascade not null,
  reseller_id    uuid references resellers(id) on delete cascade not null,
  user_id         uuid default auth.uid() references auth.users(id) on delete cascade not null,
  quantity        integer not null,
  price_per_unit  numeric not null default 0,
  status          text not null default 'active' check (status in ('active', 'completed')),
  distributed_at  timestamptz default now()
);
create table reseller_payments (
  id              uuid default gen_random_uuid() primary key,
  distribution_id uuid references distributions(id) on delete cascade not null,
  user_id         uuid default auth.uid() references auth.users(id) on delete cascade not null,
  quantity        integer not null,
  amount          numeric not null,
  paid_at         timestamptz default now()
);
create table cashflow (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid default auth.uid() references auth.users(id) on delete cascade not null,
  type             text not null check (type in ('income','expense')),
  category         text not null,
  amount           numeric not null default 0,
  description      text,
  transaction_date timestamptz default now(),
  created_at       timestamptz default now()
);
create table stock_movements (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid default auth.uid() references auth.users(id) on delete cascade not null,
  reference_type  text not null,
  reference_id    uuid not null,
  material_id     uuid references raw_materials(id) on delete set null,
  variant_id      uuid references variants(id) on delete set null,
  quantity_change numeric not null,
  stock_after     numeric not null,
  notes           text,
  created_at      timestamptz default now()
);
-- ─── 3. KONFIGURASI ────────────────────────────────────────
create table initial_balance (
  id      uuid default gen_random_uuid() primary key,
  user_id uuid default auth.uid() references auth.users(id) on delete cascade not null unique,
  amount  numeric not null default 0,
  set_at  timestamptz default now()
);
create table settings (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid default auth.uid() references auth.users(id) on delete cascade not null,
  key        text not null,
  value      text not null,
  updated_at timestamptz default now(),
  unique(user_id, key)
);
-- ─── 4. PERENCANAAN (Calculator Only) ──────────────────────
create table rad (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid default auth.uid() references auth.users(id) on delete cascade not null,
  title          text not null,
  batch_quantity integer not null default 1,
  selling_price  numeric not null default 0,
  salary_cost    numeric not null default 0,
  other_cost     numeric not null default 0,
  created_at     timestamptz default now()
);
create table rad_items (
  id               uuid default gen_random_uuid() primary key,
  rad_id           uuid references rad(id) on delete cascade not null,
  user_id          uuid default auth.uid() references auth.users(id) on delete cascade not null,
  name             text not null,
  total_qty        numeric not null default 1,
  unit             text not null default 'pcs',
  total_cost       numeric not null default 0,
  usage_per_bottle numeric not null default 1,
  created_at       timestamptz default now()
);
-- ─── 5. DATABASE FUNCTIONS ─────────────────────────────────
-- FN 1: Restock bahan baku
create or replace function fn_restock_material(
  p_user_id         uuid,
  p_material_id     uuid,
  p_qty             numeric,
  p_total_cost      numeric,
  p_record_cashflow boolean default false
) returns void as $$
declare
  v_old_stock numeric;
  v_old_cost  numeric;
  v_new_cost  numeric;
begin
  select stock, cost_per_unit into v_old_stock, v_old_cost
  from raw_materials where id = p_material_id and user_id = p_user_id;
  -- weighted average cost
  if v_old_stock + p_qty > 0 then
    v_new_cost := ((v_old_stock * v_old_cost) + p_total_cost) / (v_old_stock + p_qty);
  else
    v_new_cost := p_total_cost / p_qty;
  end if;
  update raw_materials
  set stock = stock + p_qty, cost_per_unit = v_new_cost, updated_at = now()
  where id = p_material_id and user_id = p_user_id;
  insert into stock_movements (user_id, reference_type, reference_id, material_id, quantity_change, stock_after, notes)
  values (p_user_id, 'restock', p_material_id, p_material_id, p_qty, v_old_stock + p_qty, 'Restock bahan baku');
  if p_record_cashflow then
    insert into cashflow (user_id, type, category, amount, description, transaction_date)
    values (p_user_id, 'expense', 'Produksi', p_total_cost, 'Restock bahan baku', now());
  end if;
end;
$$ language plpgsql security definer;
-- FN 2: Jalankan produksi
create or replace function fn_run_production(
  p_user_id    uuid,
  p_variant_id uuid,
  p_quantity   integer,
  p_notes      text default null
) returns void as $$
declare
  r record;
  v_total_cost numeric := 0;
  v_old_stock numeric;
begin
  -- validasi semua bahan cukup
  for r in
    select rm.id as material_id, rm.name, rm.stock, rm.cost_per_unit, rec.quantity_needed
    from recipes rec
    join raw_materials rm on rm.id = rec.raw_material_id
    where rec.variant_id = p_variant_id and rec.user_id = p_user_id
  loop
    if r.stock < (r.quantity_needed * p_quantity) then
      raise exception 'Stok % kurang: butuh %, tersedia %', r.name, r.quantity_needed * p_quantity, r.stock;
    end if;
  end loop;
  -- kurangi bahan + hitung total cost
  for r in
    select rm.id as material_id, rm.name, rm.stock, rm.cost_per_unit, rec.quantity_needed
    from recipes rec
    join raw_materials rm on rm.id = rec.raw_material_id
    where rec.variant_id = p_variant_id and rec.user_id = p_user_id
  loop
    v_old_stock := r.stock;
    v_total_cost := v_total_cost + (r.cost_per_unit * r.quantity_needed * p_quantity);
    update raw_materials
    set stock = stock - (r.quantity_needed * p_quantity), updated_at = now()
    where id = r.material_id and user_id = p_user_id;
    insert into stock_movements (user_id, reference_type, reference_id, material_id, quantity_change, stock_after, notes)
    values (p_user_id, 'production', p_variant_id, r.material_id, -(r.quantity_needed * p_quantity), v_old_stock - (r.quantity_needed * p_quantity), 'Produksi batch');
  end loop;
  -- tambah stok variant
  update variants
  set stock_own = stock_own + p_quantity, updated_at = now()
  where id = p_variant_id and user_id = p_user_id;
  -- catat produksi
  insert into productions (variant_id, user_id, quantity, total_cost, notes)
  values (p_variant_id, p_user_id, p_quantity, v_total_cost, p_notes);
  -- catat cashflow (biaya produksi dari bahan)
  insert into cashflow (user_id, type, category, amount, description, transaction_date)
  values (p_user_id, 'expense', 'Produksi', v_total_cost, 'Produksi ' || p_quantity || ' pcs', now());
end;
$$ language plpgsql security definer;
-- FN 3: Catat penjualan sendiri
create or replace function fn_record_sale(
  p_user_id         uuid,
  p_variant_id      uuid,
  p_quantity        integer,
  p_unit_price      numeric,
  p_record_cashflow boolean default false
) returns void as $$
declare
  v_cur_stock integer;
begin
  select stock_own into v_cur_stock from variants where id = p_variant_id and user_id = p_user_id;
  if v_cur_stock < p_quantity then
    raise exception 'Stok tidak cukup: butuh %, tersedia %', p_quantity, v_cur_stock;
  end if;
  update variants
  set stock_own = stock_own - p_quantity, updated_at = now()
  where id = p_variant_id and user_id = p_user_id;
  insert into sales (variant_id, user_id, quantity, unit_price, total_amount, notes)
  values (p_variant_id, p_user_id, p_quantity, p_unit_price, p_unit_price * p_quantity, 'Penjualan');
  insert into stock_movements (user_id, reference_type, reference_id, variant_id, quantity_change, stock_after, notes)
  values (p_user_id, 'sale', p_variant_id, p_variant_id, -(p_quantity), v_cur_stock - p_quantity, 'Penjualan');
  if p_record_cashflow then
    insert into cashflow (user_id, type, category, amount, description, transaction_date)
    values (p_user_id, 'income', 'Penjualan', p_unit_price * p_quantity, 'Penjualan produk', now());
  end if;
end;
$$ language plpgsql security definer;
-- FN 4: Distribusi ke reseller
create or replace function fn_distribute_to_reseller(
  p_user_id       uuid,
  p_variant_id    uuid,
  p_reseller_id   uuid,
  p_quantity      integer,
  p_price_per_unit numeric
) returns uuid as $$
declare
  v_cur_stock integer;
  v_dist_id   uuid;
begin
  select stock_own into v_cur_stock from variants where id = p_variant_id and user_id = p_user_id;
  if v_cur_stock < p_quantity then
    raise exception 'Stok tidak cukup: butuh %, tersedia %', p_quantity, v_cur_stock;
  end if;
  update variants
  set stock_own = stock_own - p_quantity,
      stock_reseller = stock_reseller + p_quantity,
      updated_at = now()
  where id = p_variant_id and user_id = p_user_id;
  v_dist_id := gen_random_uuid();
  insert into distributions (id, variant_id, reseller_id, user_id, quantity, price_per_unit, status)
  values (v_dist_id, p_variant_id, p_reseller_id, p_user_id, p_quantity, p_price_per_unit, 'active');
  insert into stock_movements (user_id, reference_type, reference_id, variant_id, quantity_change, stock_after, notes)
  values (p_user_id, 'distribution', v_dist_id, p_variant_id, -(p_quantity), v_cur_stock - p_quantity, 'Distribusi ke reseller');
  return v_dist_id;
end;
$$ language plpgsql security definer;
-- FN 5: Reseller bayar / lapor laku
create or replace function fn_reseller_payment(
  p_user_id         uuid,
  p_distribution_id uuid,
  p_quantity        integer,
  p_amount          numeric,
  p_record_cashflow boolean default false
) returns void as $$
declare
  v_dist distributions;
  v_total_paid integer;
  v_cur_stock_reseller integer;
begin
  select * into v_dist from distributions where id = p_distribution_id and user_id = p_user_id;
  if v_dist is null then
    raise exception 'Distribusi tidak ditemukan';
  end if;
  if v_dist.status != 'active' then
    raise exception 'Distribusi sudah selesai';
  end if;
  select coalesce(sum(quantity), 0) into v_total_paid
  from reseller_payments where distribution_id = p_distribution_id;
  if v_total_paid + p_quantity > v_dist.quantity then
    raise exception 'Jumlah melebihi sisa distribusi. Sisa: %', v_dist.quantity - v_total_paid;
  end if;
  select stock_reseller into v_cur_stock_reseller from variants where id = v_dist.variant_id and user_id = p_user_id;
  update variants
  set stock_reseller = stock_reseller - p_quantity, updated_at = now()
  where id = v_dist.variant_id and user_id = p_user_id;
  insert into reseller_payments (distribution_id, user_id, quantity, amount)
  values (p_distribution_id, p_user_id, p_quantity, p_amount);
  insert into stock_movements (user_id, reference_type, reference_id, variant_id, quantity_change, stock_after, notes)
  values (p_user_id, 'sale', p_distribution_id, v_dist.variant_id, -(p_quantity), v_cur_stock_reseller - p_quantity, 'Reseller bayar');
  -- auto-complete jika semua sudah dibayar
  if v_total_paid + p_quantity >= v_dist.quantity then
    update distributions set status = 'completed' where id = p_distribution_id;
  end if;
  if p_record_cashflow then
    insert into cashflow (user_id, type, category, amount, description, transaction_date)
    values (p_user_id, 'income', 'Penjualan Reseller', p_amount, 'Pembayaran reseller', now());
  end if;
end;
$$ language plpgsql security definer;
-- FN 6: Tambah transaksi cashflow manual
create or replace function fn_add_cashflow(
  p_user_id     uuid,
  p_type        text,
  p_category    text,
  p_amount      numeric,
  p_description text default null,
  p_date        timestamptz default now()
) returns uuid as $$
declare
  v_id uuid;
begin
  v_id := gen_random_uuid();
  insert into cashflow (id, user_id, type, category, amount, description, transaction_date)
  values (v_id, p_user_id, p_type, p_category, p_amount, p_description, p_date);
  return v_id;
end;
$$ language plpgsql security definer;
-- ─── 6. DATABASE VIEWS ────────────────────────────────────
-- View: Dashboard Metrics (semua angka dashboard dalam 1 query)
create or replace view v_dashboard_metrics as
with
  cf_all as (
    select
      coalesce(sum(case when type = 'income' then amount else 0 end), 0) as income_all,
      coalesce(sum(case when type = 'expense' then amount else 0 end), 0) as expense_all
    from cashflow where user_id = auth.uid()
  ),
  cf_bulan as (
    select
      coalesce(sum(case when type = 'income' then amount else 0 end), 0) as income_bulan,
      coalesce(sum(case when type = 'expense' then amount else 0 end), 0) as expense_bulan
    from cashflow
    where user_id = auth.uid() and transaction_date >= date_trunc('month', now())
  ),
  cat_bulan as (
    select
      coalesce(sum(case when category = 'Gaji Karyawan' then amount else 0 end), 0) as gaji,
      coalesce(sum(case when category = 'Marketing' then amount else 0 end), 0) as marketing,
      coalesce(sum(case when category = 'Operasional' then amount else 0 end), 0) as operasional
    from cashflow
    where user_id = auth.uid() and transaction_date >= date_trunc('month', now())
  ),
  sales_data as (
    select
      coalesce(sum(quantity), 0) as total_sold,
      coalesce(sum(case when sold_at >= date_trunc('month', now()) then quantity else 0 end), 0) as sold_bulan
    from sales where user_id = auth.uid()
  ),
  piutang as (
    select coalesce(sum(d.quantity * d.price_per_unit), 0) - coalesce(sum(rp.amount), 0) as total_piutang
    from distributions d
    left join reseller_payments rp on rp.distribution_id = d.id
    where d.user_id = auth.uid()
  ),
  critical as (
    select count(*)::int as crit_count
    from raw_materials where user_id = auth.uid() and stock <= min_stock
  ),
  modal_data as (
    select coalesce(nullif(value, '')::numeric, 0) as modal
    from settings where user_id = auth.uid() and key = 'modal_bisnis'
  ),
  hpp_data as (
    select coalesce(nullif(value, '')::numeric, 0) as hpp
    from settings where user_id = auth.uid() and key = 'hpp_per_unit'
  ),
  price_data as (
    select coalesce(nullif(value, '')::numeric, 0) as price
    from settings where user_id = auth.uid() and key = 'selling_price'
  )
select
  cf_all.income_all                                as total_income_all,
  cf_all.expense_all                               as total_expense_all,
  cf_all.income_all - cf_all.expense_all           as saldo,
  cf_bulan.income_bulan                            as total_income_bulan,
  cf_bulan.expense_bulan                           as total_expense_bulan,
  cf_bulan.income_bulan - cf_bulan.expense_bulan   as saldo_bulan,
  modal_data.modal                                 as modal_bisnis,
  (cf_all.income_all - cf_all.expense_all) - modal_data.modal as profit_bersih,
  case when modal_data.modal > 0 then ((cf_all.income_all - cf_all.expense_all) - modal_data.modal) / modal_data.modal * 100 else 0 end as roi,
  sales_data.total_sold                            as total_sold,
  sales_data.sold_bulan                            as total_sold_bulan,
  piutang.total_piutang                            as total_piutang,
  critical.crit_count                              as critical_stock_count,
  cat_bulan.gaji                                   as gaji_bulan,
  cat_bulan.marketing                              as marketing_bulan,
  cat_bulan.operasional                            as operasional_bulan,
  case when (price_data.price - hpp_data.hpp) > 0
    then ceil((cat_bulan.gaji + cat_bulan.marketing + cat_bulan.operasional) / (price_data.price - hpp_data.hpp))
    else 0 end                                     as bep_botol,
  hpp_data.hpp                                    as hpp_per_unit,
  price_data.price                                as selling_price
from cf_all, cf_bulan, cat_bulan, sales_data, piutang, critical, modal_data, hpp_data, price_data;
-- View: Piutang per reseller
create or replace view v_piutang_reseller as
select
  r.id          as reseller_id,
  r.name        as reseller_name,
  coalesce(sum(d.quantity * d.price_per_unit), 0) as total_distribusi,
  coalesce(sum(rp.amount), 0)                     as total_dibayar,
  coalesce(sum(d.quantity * d.price_per_unit), 0) - coalesce(sum(rp.amount), 0) as sisa_piutang
from resellers r
left join distributions d on d.reseller_id = r.id and d.user_id = auth.uid()
left join reseller_payments rp on rp.distribution_id = d.id
where r.user_id = auth.uid()
group by r.id, r.name
having coalesce(sum(d.quantity * d.price_per_unit), 0) - coalesce(sum(rp.amount), 0) > 0;
-- View: Produk paling laku (chart)
create or replace view v_product_sales as
select
  v.id          as variant_id,
  v.name        as variant_name,
  p.name        as product_name,
  coalesce(sum(s.quantity), 0)    as total_qty,
  coalesce(sum(s.total_amount), 0) as total_revenue
from variants v
join products p on p.id = v.product_id
left join sales s on s.variant_id = v.id
where v.user_id = auth.uid()
group by v.id, v.name, p.name
order by total_revenue desc;
-- View: Tren cashflow 6 bulan
create or replace view v_cashflow_monthly as
with months as (
  select generate_series(
    date_trunc('month', now()) - interval '5 months',
    date_trunc('month', now()),
    interval '1 month'
  )::date as month_start
)
select
  to_char(m.month_start, 'YYYY-MM') as month,
  coalesce(sum(case when cf.type = 'income' then cf.amount else 0 end), 0) as total_income,
  coalesce(sum(case when cf.type = 'expense' then cf.amount else 0 end), 0) as total_expense,
  coalesce(sum(case when cf.type = 'income' then cf.amount else -cf.amount end), 0) as net
from months m
left join cashflow cf
  on cf.user_id = auth.uid()
  and cf.transaction_date >= m.month_start
  and cf.transaction_date < m.month_start + interval '1 month'
group by m.month_start
order by m.month_start;
-- ─── 7. RLS POLICIES ──────────────────────────────────────
alter table raw_materials enable row level security;
create policy "user_isolation" on raw_materials for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table products enable row level security;
create policy "user_isolation" on products for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table variants enable row level security;
create policy "user_isolation" on variants for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table recipes enable row level security;
create policy "user_isolation" on recipes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table resellers enable row level security;
create policy "user_isolation" on resellers for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table productions enable row level security;
create policy "user_isolation" on productions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table sales enable row level security;
create policy "user_isolation" on sales for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table distributions enable row level security;
create policy "user_isolation" on distributions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table reseller_payments enable row level security;
create policy "user_isolation" on reseller_payments for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table cashflow enable row level security;
create policy "user_isolation" on cashflow for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table initial_balance enable row level security;
create policy "user_isolation" on initial_balance for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table settings enable row level security;
create policy "user_isolation" on settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table rad enable row level security;
create policy "user_isolation" on rad for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table rad_items enable row level security;
create policy "user_isolation" on rad_items for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
alter table stock_movements enable row level security;
create policy "user_isolation" on stock_movements for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- ─── 8. INDEXES ───────────────────────────────────────────
create index if not exists idx_raw_materials_user on raw_materials(user_id);
create index if not exists idx_products_user on products(user_id);
create index if not exists idx_variants_user on variants(user_id);
create index if not exists idx_variants_product on variants(product_id);
create index if not exists idx_recipes_variant on recipes(variant_id);
create index if not exists idx_recipes_user on recipes(user_id);
create index if not exists idx_cashflow_user_date on cashflow(user_id, transaction_date);
create index if not exists idx_sales_user_date on sales(user_id, sold_at);
create index if not exists idx_stock_movements_user_ref on stock_movements(user_id, reference_type);
create index if not exists idx_stock_movements_material on stock_movements(material_id);
create index if not exists idx_distributions_reseller on distributions(reseller_id, status);
create index if not exists idx_reseller_payments_dist on reseller_payments(distribution_id);
create index if not exists idx_settings_user_key on settings(user_id, key);
STEP 2: src/types/index.ts
Timpa total file src/types/index.ts:
// ═══════════════════════════════════════════════════════════
// GLAM MANAGEMENT V2 — Type Definitions
// ═══════════════════════════════════════════════════════════
// ─── Master Data ──────────────────────────────────────────
export interface RawMaterial {
  id: string
  user_id: string
  name: string
  unit: string
  stock: number
  min_stock: number
  cost_per_unit: number
  created_at: string
  updated_at: string
}
export interface Product {
  id: string
  user_id: string
  name: string
  description?: string
  image_url?: string
  created_at: string
  updated_at: string
  variants?: Variant[]
}
export interface Variant {
  id: string
  product_id: string
  user_id: string
  name: string
  size_ml: number
  selling_price: number
  stock_own: number
  stock_reseller: number
  created_at: string
  updated_at: string
  product?: Product
  recipes?: Recipe[]
  total_produced?: number
  total_sold?: number
}
export interface Recipe {
  id: string
  variant_id: string
  raw_material_id: string
  user_id: string
  quantity_needed: number
  created_at: string
  updated_at: string
  raw_material?: RawMaterial
  variant?: Variant
}
export interface Reseller {
  id: string
  user_id: string
  name: string
  contact?: string
  created_at: string
  updated_at: string
}
// ─── Transaksi / Operasional ──────────────────────────────
export interface Production {
  id: string
  variant_id: string
  user_id: string
  quantity: number
  total_cost: number
  produced_at: string
  notes?: string
  variant?: Variant
}
export interface Sale {
  id: string
  variant_id: string
  user_id: string
  quantity: number
  unit_price: number
  total_amount: number
  sold_at: string
  notes?: string
  variant?: Variant
}
export interface Distribution {
  id: string
  variant_id: string
  reseller_id: string
  user_id: string
  quantity: number
  price_per_unit: number
  status: 'active' | 'completed'
  distributed_at: string
  reseller?: Reseller
  variant?: Variant
}
export interface ResellerPayment {
  id: string
  distribution_id: string
  user_id: string
  quantity: number
  amount: number
  paid_at: string
  distribution?: Distribution
}
export interface Cashflow {
  id: string
  user_id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description?: string
  transaction_date: string
  created_at: string
}
export interface StockMovement {
  id: string
  user_id: string
  reference_type: string
  reference_id: string
  material_id?: string
  variant_id?: string
  quantity_change: number
  stock_after: number
  notes?: string
  created_at: string
}
// ─── Konfigurasi ──────────────────────────────────────────
export interface InitialBalance {
  id: string
  user_id: string
  amount: number
  set_at: string
}
export interface Setting {
  id: string
  user_id: string
  key: string
  value: string
  updated_at: string
}
// ─── Perencanaan ──────────────────────────────────────────
export interface Rad {
  id: string
  user_id: string
  title: string
  batch_quantity: number
  selling_price: number
  salary_cost: number
  other_cost: number
  created_at: string
  items?: RadItem[]
}
export interface RadItem {
  id: string
  rad_id: string
  user_id: string
  name: string
  total_qty: number
  unit: string
  total_cost: number
  usage_per_bottle: number
  created_at: string
}
// ─── Dashboard Views ──────────────────────────────────────
export interface DashboardMetrics {
  total_income_all: number
  total_expense_all: number
  saldo: number
  total_income_bulan: number
  total_expense_bulan: number
  saldo_bulan: number
  modal_bisnis: number
  profit_bersih: number
  roi: number
  total_sold: number
  total_sold_bulan: number
  total_piutang: number
  critical_stock_count: number
  gaji_bulan: number
  marketing_bulan: number
  operasional_bulan: number
  bep_botol: number
  hpp_per_unit: number
  selling_price: number
}
export interface PiutangReseller {
  reseller_id: string
  reseller_name: string
  total_distribusi: number
  total_dibayar: number
  sisa_piutang: number
}
export interface ProductSalesData {
  variant_id: string
  variant_name: string
  product_name: string
  total_qty: number
  total_revenue: number
}
export interface CashflowMonthlyData {
  month: string
  total_income: number
  total_expense: number
  net: number
}
STEP 3: src/lib/db/*.ts (Repository Layer)
Bikin folder src/lib/db/ dengan 13 file ini. Setiap file adalah pure async functions yang panggil Supabase (RPC atau .from()).
src/lib/db/index.ts (barrel export)
export * from './materials'
export * from './products'
export * from './variants'
export * from './recipes'
export * from './productions'
export * from './sales'
export * from './distributions'
export * from './resellers'
export * from './cashflow'
export * from './settings'
export * from './balance'
export * from './rad'
export * from './dashboard'
src/lib/db/materials.ts
import { supabase } from '@/lib/supabase'
import type { RawMaterial } from '@/types'
export const materialsDb = {
  async getAll(): Promise<RawMaterial[]> {
    const { data, error } = await supabase.from('raw_materials').select('*').order('name')
    if (error) throw error
    return data
  },
  async create(params: { name: string; unit: string; stock: number; min_stock: number }) {
    const { data, error } = await supabase.from('raw_materials').insert(params).select().single()
    if (error) throw error
    return data
  },
  async update(id: string, params: Partial<Pick<RawMaterial, 'name' | 'unit' | 'stock' | 'min_stock'>>) {
    const { data, error } = await supabase.from('raw_materials').update({ ...params, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async remove(id: string) {
    const { error } = await supabase.from('raw_materials').delete().eq('id', id)
    if (error) throw error
  },
  async restock(params: {
    materialId: string
    qty: number
    totalCost: number
    recordCashflow?: boolean
  }) {
    const { error } = await supabase.rpc('fn_restock_material', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_material_id: params.materialId,
      p_qty: params.qty,
      p_total_cost: params.totalCost,
      p_record_cashflow: params.recordCashflow ?? false,
    })
    if (error) throw error
  },
}
src/lib/db/products.ts
import { supabase } from '@/lib/supabase'
import type { Product, Variant } from '@/types'
export const productsDb = {
  async getAll(): Promise<(Product & { variants: Variant[] })[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, variants(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  async create(name: string, description?: string) {
    const { data, error } = await supabase
      .from('products')
      .insert({ name, description })
      .select()
      .single()
    if (error) throw error
    return data
  },
  async update(id: string, params: { name: string; description?: string }) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...params, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
  async remove(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  },
}
src/lib/db/variants.ts
import { supabase } from '@/lib/supabase'
import type { Variant } from '@/types'
export const variantsDb = {
  async create(params: {
    product_id: string
    name: string
    size_ml: number
    selling_price: number
    stock_own: number
  }) {
    const { data, error } = await supabase.from('variants').insert(params).select().single()
    if (error) throw error
    return data
  },
  async update(id: string, params: Partial<Pick<Variant, 'name' | 'size_ml' | 'selling_price'>>) {
    const { data, error } = await supabase
      .from('variants')
      .update({ ...params, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
  async remove(id: string) {
    const { error } = await supabase.from('variants').delete().eq('id', id)
    if (error) throw error
  },
  async getWithStats(): Promise<{ variant_id: string; total_produced: number; total_sold: number }[]> {
    const [prodRes, salesRes] = await Promise.all([
      supabase.from('productions').select('variant_id, quantity'),
      supabase.from('sales').select('variant_id, quantity'),
    ])
    // aggregate logic di sini — sederhana
    const prodMap: Record<string, number> = {}
    const salesMap: Record<string, number> = {}
    ;(prodRes.data || []).forEach((p: any) => { prodMap[p.variant_id] = (prodMap[p.variant_id] || 0) + p.quantity })
    ;(salesRes.data || []).forEach((s: any) => { salesMap[s.variant_id] = (salesMap[s.variant_id] || 0) + s.quantity })
    const allIds = [...new Set([...Object.keys(prodMap), ...Object.keys(salesMap)])]
    return allIds.map(id => ({
      variant_id: id,
      total_produced: prodMap[id] || 0,
      total_sold: salesMap[id] || 0,
    }))
  },
}
src/lib/db/recipes.ts
import { supabase } from '@/lib/supabase'
import type { Recipe, RawMaterial, Variant } from '@/types'
export const recipesDb = {
  async getAllByVariant(): Promise<(Variant & { recipes: (Recipe & { raw_material: RawMaterial })[] })[]> {
    const { data, error } = await supabase
      .from('variants')
      .select('*, recipes(*, raw_material:raw_materials(*)), product:products(name)')
      .order('created_at')
    if (error) throw error
    return data
  },
  async create(params: { variant_id: string; raw_material_id: string; quantity_needed: number }) {
    const { data, error } = await supabase.from('recipes').insert(params).select().single()
    if (error) throw error
    return data
  },
  async remove(id: string) {
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) throw error
  },
}
src/lib/db/productions.ts
import { supabase } from '@/lib/supabase'
import type { Production, Variant } from '@/types'
export const productionsDb = {
  async getAll(page = 1, limit = 15): Promise<{ data: (Production & { variant: Variant })[]; count: number }> {
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, count, error } = await supabase
      .from('productions')
      .select('*, variant:variants(*, product:products(name))', { count: 'exact' })
      .order('produced_at', { ascending: false })
      .range(from, to)
    if (error) throw error
    return { data, count: count || 0 }
  },
  async run(params: {
    variantId: string
    quantity: number
    notes?: string
  }) {
    const { error } = await supabase.rpc('fn_run_production', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_variant_id: params.variantId,
      p_quantity: params.quantity,
      p_notes: params.notes || null,
    })
    if (error) throw error
  },
}
src/lib/db/sales.ts
import { supabase } from '@/lib/supabase'
export const salesDb = {
  async recordSale(params: {
    variantId: string
    quantity: number
    unitPrice: number
    recordCashflow?: boolean
  }) {
    const { error } = await supabase.rpc('fn_record_sale', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_variant_id: params.variantId,
      p_quantity: params.quantity,
      p_unit_price: params.unitPrice,
      p_record_cashflow: params.recordCashflow ?? false,
    })
    if (error) throw error
  },
}
src/lib/db/distributions.ts
import { supabase } from '@/lib/supabase'
export const distributionsDb = {
  async distribute(params: {
    variantId: string
    resellerId: string
    quantity: number
    pricePerUnit: number
  }): Promise<string> {
    const { data, error } = await supabase.rpc('fn_distribute_to_reseller', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_variant_id: params.variantId,
      p_reseller_id: params.resellerId,
      p_quantity: params.quantity,
      p_price_per_unit: params.pricePerUnit,
    })
    if (error) throw error
    return data
  },
  async getByReseller(resellerId: string) {
    const { data, error } = await supabase
      .from('distributions')
      .select('*, variant:variants(name, product:products(name)), reseller:resellers(name)')
      .eq('reseller_id', resellerId)
      .order('distributed_at', { ascending: false })
    if (error) throw error
    return data
  },
}
src/lib/db/resellers.ts
import { supabase } from '@/lib/supabase'
import type { Reseller } from '@/types'
export const resellersDb = {
  async getAll(): Promise<Reseller[]> {
    const { data, error } = await supabase.from('resellers').select('*').order('name')
    if (error) throw error
    return data
  },
  async createOrGet(name: string): Promise<Reseller> {
    const { data: existing } = await supabase
      .from('resellers')
      .select('*')
      .ilike('name', name)
      .maybeSingle()
    if (existing) return existing
    const { data, error } = await supabase.from('resellers').insert({ name }).select().single()
    if (error) throw error
    return data
  },
  async remove(id: string) {
    const { error } = await supabase.from('resellers').delete().eq('id', id)
    if (error) throw error
  },
  async recordPayment(params: {
    distributionId: string
    quantity: number
    amount: number
    recordCashflow?: boolean
  }) {
    const { error } = await supabase.rpc('fn_reseller_payment', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_distribution_id: params.distributionId,
      p_quantity: params.quantity,
      p_amount: params.amount,
      p_record_cashflow: params.recordCashflow ?? false,
    })
    if (error) throw error
  },
}
src/lib/db/cashflow.ts
import { supabase } from '@/lib/supabase'
import type { Cashflow } from '@/types'
export const cashflowDb = {
  async getAll(params: {
    period?: 'daily' | 'weekly' | 'monthly' | 'all'
    page?: number
    limit?: number
  } = {}): Promise<{ data: Cashflow[]; count: number }> {
    let query = supabase.from('cashflow').select('*', { count: 'exact' })
    const now = new Date()
    if (params.period === 'daily') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      query = query.gte('transaction_date', start)
    } else if (params.period === 'weekly') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('transaction_date', start)
    } else if (params.period === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      query = query.gte('transaction_date', start)
    }
    const from = ((params.page || 1) - 1) * (params.limit || 20)
    const to = from + (params.limit || 20) - 1
    const { data, count, error } = await query.order('transaction_date', { ascending: false }).range(from, to)
    if (error) throw error
    return { data, count: count || 0 }
  },
  async addTransaction(params: {
    type: 'income' | 'expense'
    category: string
    amount: number
    description?: string
    date?: string
  }) {
    const { error } = await supabase.rpc('fn_add_cashflow', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_type: params.type,
      p_category: params.category,
      p_amount: params.amount,
      p_description: params.description || null,
      p_date: params.date || new Date().toISOString(),
    })
    if (error) throw error
  },
  async remove(id: string) {
    const { error } = await supabase.from('cashflow').delete().eq('id', id)
    if (error) throw error
  },
}
src/lib/db/settings.ts
import { supabase } from '@/lib/supabase'
export const settingsDb = {
  async get(key: string): Promise<string | null> {
    const { data, error } = await supabase.from('settings').select('value').eq('key', key).single()
    if (error) return null
    return data?.value || null
  },
  async set(key: string, value: string) {
    const { error } = await supabase.from('settings').upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,key' }
    )
    if (error) throw error
  },
  async getAll(): Promise<Record<string, string>> {
    const { data, error } = await supabase.from('settings').select('key, value')
    if (error) throw error
    return Object.fromEntries((data || []).map((s: any) => [s.key, s.value]))
  },
}
src/lib/db/balance.ts
import { supabase } from '@/lib/supabase'
import type { InitialBalance } from '@/types'
export const balanceDb = {
  async get(): Promise<InitialBalance | null> {
    const { data, error } = await supabase.from('initial_balance').select('*').single()
    if (error) return null
    return data
  },
  async set(amount: number) {
    const { error } = await supabase.from('initial_balance').upsert(
      { amount, set_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    if (error) throw error
  },
}
src/lib/db/rad.ts
import { supabase } from '@/lib/supabase'
import type { Rad, RadItem } from '@/types'
export const radDb = {
  async getAll(): Promise<(Rad & { items: RadItem[] })[]> {
    const { data, error } = await supabase
      .from('rad')
      .select('*, items:rad_items(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },
  async create(params: {
    title: string
    batch_quantity: number
    selling_price: number
    salary_cost: number
    other_cost: number
    items: { name: string; total_qty: number; unit: string; total_cost: number; usage_per_bottle: number }[]
  }) {
    const { data: radData, error: radErr } = await supabase
      .from('rad')
      .insert({
        title: params.title,
        batch_quantity: params.batch_quantity,
        selling_price: params.selling_price,
        salary_cost: params.salary_cost,
        other_cost: params.other_cost,
      })
      .select()
      .single()
    if (radErr) throw radErr
    const items = params.items.map(item => ({ ...item, rad_id: radData.id }))
    const { error: itemsErr } = await supabase.from('rad_items').insert(items)
    if (itemsErr) throw itemsErr
    return radData
  },
  async remove(id: string) {
    const { error } = await supabase.from('rad').delete().eq('id', id)
    if (error) throw error
  },
}
src/lib/db/dashboard.ts
import { supabase } from '@/lib/supabase'
import type { DashboardMetrics, PiutangReseller, ProductSalesData, CashflowMonthlyData, RawMaterial } from '@/types'
export const dashboardDb = {
  async getMetrics(): Promise<DashboardMetrics | null> {
    const { data, error } = await supabase.from('v_dashboard_metrics').select('*').single()
    if (error) return null
    return data
  },
  async getPiutang(): Promise<PiutangReseller[]> {
    const { data, error } = await supabase.from('v_piutang_reseller').select('*')
    if (error) return []
    return data || []
  },
  async getProductSales(): Promise<ProductSalesData[]> {
    const { data, error } = await supabase.from('v_product_sales').select('*')
    if (error) return []
    return data || []
  },
  async getCashflowTrend(): Promise<CashflowMonthlyData[]> {
    const { data, error } = await supabase.from('v_cashflow_monthly').select('*')
    if (error) return []
    return data || []
  },
  async getCriticalMaterials(): Promise<RawMaterial[]> {
    const { data, error } = await supabase
      .from('raw_materials')
      .select('*')
    if (error) return []
    return (data || []).filter(m => m.stock <= m.min_stock)
  },
}
STEP 4: src/lib/hooks/*.ts (Custom Hooks)
Bikin folder src/lib/hooks/. Setiap hook wrap repository function + React state.
src/lib/hooks/index.ts
export { useMaterials } from './useMaterials'
export { useProducts } from './useProducts'
export { useRecipes } from './useRecipes'
export { useProductions } from './useProductions'
export { useResellers } from './useResellers'
export { useCashflow } from './useCashflow'
export { useSettings } from './useSettings'
export { useDashboard } from './useDashboard'
export { useRad } from './useRad'
src/lib/hooks/useMaterials.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { materialsDb } from '@/lib/db'
import type { RawMaterial } from '@/types'
import { useToast } from '@/components/ui/Toaster'
export function useMaterials() {
  const { toast } = useToast()
  const [data, setData] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const fetch = useCallback(async () => {
    setLoading(true)
    try { setData(await materialsDb.getAll()) }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [toast])
  useEffect(() => { fetch() }, [fetch])
  const create = async (p: Parameters<typeof materialsDb.create>[0]) => {
    setSaving(true)
    try { await materialsDb.create(p); await fetch(); toast.success('Bahan ditambahkan') }
    catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }
  const update = async (id: string, p: Parameters<typeof materialsDb.update>[1]) => {
    setSaving(true)
    try { await materialsDb.update(id, p); await fetch(); toast.success('Bahan diupdate') }
    catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }
  const remove = async (id: string) => {
    try { await materialsDb.remove(id); await fetch(); toast.success('Bahan dihapus') }
    catch (e: any) { toast.error(e.message) }
  }
  const restock = async (p: Parameters<typeof materialsDb.restock>[0]) => {
    setSaving(true)
    try { await materialsDb.restock(p); await fetch(); toast.success('Restock berhasil') }
    catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }
  return { data, loading, saving, create, update, remove, restock, refetch: fetch }
}
src/lib/hooks/useProducts.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { productsDb, variantsDb } from '@/lib/db'
import type { Product, Variant } from '@/types'
import { useToast } from '@/components/ui/Toaster'
export function useProducts() {
  const { toast } = useToast()
  const [data, setData] = useState<(Product & { variants: Variant[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const products = await productsDb.getAll()
      const stats = await variantsDb.getWithStats()
      const statMap: Record<string, { total_produced: number; total_sold: number }> = {}
      stats.forEach(s => { statMap[s.variant_id] = s })
      const enriched = products.map(p => ({
        ...p,
        variants: (p.variants || []).map(v => ({
          ...v,
          total_produced: statMap[v.id]?.total_produced || 0,
          total_sold: statMap[v.id]?.total_sold || 0,
        })),
      }))
      setData(enriched)
    }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [toast])
  useEffect(() => { fetch() }, [fetch])
  const createProduct = async (name: string, description?: string) => {
    setSaving(true)
    try { await productsDb.create(name, description); await fetch(); toast.success('Produk dibuat') }
    catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }
  const updateProduct = async (id: string, p: { name: string; description?: string }) => {
    setSaving(true)
    try { await productsDb.update(id, p); await fetch(); toast.success('Produk diupdate') }
    catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }
  const removeProduct = async (id: string) => {
    try { await productsDb.remove(id); await fetch(); toast.success('Produk dihapus') }
    catch (e: any) { toast.error(e.message) }
  }
  const createVariant = async (p: Parameters<typeof variantsDb.create>[0]) => {
    setSaving(true)
    try { await variantsDb.create(p); await fetch(); toast.success('Varian ditambahkan') }
    catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }
  const updateVariant = async (id: string, p: Parameters<typeof variantsDb.update>[1]) => {
    setSaving(true)
    try { await variantsDb.update(id, p); await fetch(); toast.success('Varian diupdate') }
    catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }
  const removeVariant = async (id: string) => {
    try { await variantsDb.remove(id); await fetch(); toast.success('Varian dihapus') }
    catch (e: any) { toast.error(e.message) }
  }
  return {
    data, loading, saving,
    createProduct, updateProduct, removeProduct,
    createVariant, updateVariant, removeVariant,
    refetch: fetch,
  }
}
src/lib/hooks/useRecipes.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { recipesDb } from '@/lib/db'
import type { Recipe, RawMaterial, Variant } from '@/types'
import { useToast } from '@/components/ui/Toaster'
export function useRecipes() {
  const { toast } = useToast()
  const [data, setData] = useState<(Variant & { recipes: (Recipe & { raw_material: RawMaterial })[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const fetch = useCallback(async () => {
    setLoading(true)
    try { setData(await recipesDb.getAllByVariant()) }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [toast])
  useEffect(() => { fetch() }, [fetch])
  const create = async (p: Parameters<typeof recipesDb.create>[0]) => {
    setSaving(true)
    try { await recipesDb.create(p); await fetch(); toast.success('Resep ditambahkan') }
    catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }
  const remove = async (id: string) => {
    try { await recipesDb.remove(id); await fetch(); toast.success('Resep dihapus') }
    catch (e: any) { toast.error(e.message) }
  }
  return { data, loading, saving, create, remove, refetch: fetch }
}
src/lib/hooks/useProductions.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { productionsDb } from '@/lib/db'
import type { Production, Variant } from '@/types'
import { useToast } from '@/components/ui/Toaster'
export function useProductions() {
  const { toast } = useToast()
  const [data, setData] = useState<(Production & { variant: Variant })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 15
  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await productionsDb.getAll(page, limit)
      setData(result.data)
      setTotal(result.count)
    }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [page, toast])
  useEffect(() => { fetch() }, [fetch])
  const run = async (p: Parameters<typeof productionsDb.run>[0]) => {
    setSaving(true)
    try { await productionsDb.run(p); setPage(1); toast.success(`Produksi ${p.quantity} pcs berhasil`) }
    catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }
  return { data, loading, saving, page, total, limit, setPage, run, refetch: fetch }
}
src/lib/hooks/useResellers.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { resellersDb } from '@/lib/db'
import type { Reseller } from '@/types'
import { useToast } from '@/components/ui/Toaster'
export function useResellers() {
  const { toast } = useToast()
  const [data, setData] = useState<Reseller[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const fetch = useCallback(async () => {
    setLoading(true)
    try { setData(await resellersDb.getAll()) }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [toast])
  useEffect(() => { fetch() }, [fetch])
  const createOrGet = async (name: string): Promise<Reseller> => {
    const r = await resellersDb.createOrGet(name)
    await fetch()
    return r
  }
  const recordPayment = async (p: Parameters<typeof resellersDb.recordPayment>[0]) => {
    setSaving(true)
    try { await resellersDb.recordPayment(p); await fetch(); toast.success('Pembayaran dicatat') }
    catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }
  return { data, loading, saving, createOrGet, recordPayment, refetch: fetch }
}
src/lib/hooks/useCashflow.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { cashflowDb } from '@/lib/db'
import type { Cashflow } from '@/types'
import { useToast } from '@/components/ui/Toaster'
export function useCashflow() {
  const { toast } = useToast()
  const [data, setData] = useState<Cashflow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20
  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await cashflowDb.getAll({ period, page, limit })
      setData(result.data)
      setTotal(result.count)
    }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [period, page, toast])
  useEffect(() => { fetch() }, [fetch])
  const addTransaction = async (p: Parameters<typeof cashflowDb.addTransaction>[0]) => {
    setSaving(true)
    try { await cashflowDb.addTransaction(p); setPage(1); toast.success('Transaksi ditambahkan') }
    catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }
  const remove = async (id: string) => {
    try { await cashflowDb.remove(id); await fetch(); toast.success('Transaksi dihapus') }
    catch (e: any) { toast.error(e.message) }
  }
  return { data, loading, saving, period, page, total, limit, setPeriod, setPage, addTransaction, remove, refetch: fetch }
}
src/lib/hooks/useSettings.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { settingsDb, balanceDb } from '@/lib/db'
import type { InitialBalance } from '@/types'
import { useToast } from '@/components/ui/Toaster'
export function useSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [balance, setBalance] = useState<InitialBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [s, b] = await Promise.all([settingsDb.getAll(), balanceDb.get()])
      setSettings(s)
      setBalance(b)
    }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [toast])
  useEffect(() => { fetch() }, [fetch])
  const setSetting = async (key: string, value: string) => {
    await settingsDb.set(key, value)
    setSettings(prev => ({ ...prev, [key]: value }))
    toast.success('Pengaturan disimpan')
  }
  const setInitialBalance = async (amount: number) => {
    await balanceDb.set(amount)
    setBalance({ amount, user_id: balance?.user_id || '', id: balance?.id || '', set_at: new Date().toISOString() })
    toast.success('Saldo awal disimpan')
  }
  return { settings, balance, loading, setSetting, setInitialBalance, refetch: fetch }
}
src/lib/hooks/useDashboard.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { dashboardDb } from '@/lib/db'
import type { DashboardMetrics, PiutangReseller, ProductSalesData, CashflowMonthlyData, RawMaterial } from '@/types'
import { useToast } from '@/components/ui/Toaster'
export function useDashboard() {
  const { toast } = useToast()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [piutang, setPiutang] = useState<PiutangReseller[]>([])
  const [productSales, setProductSales] = useState<ProductSalesData[]>([])
  const [cashflowTrend, setCashflowTrend] = useState<CashflowMonthlyData[]>([])
  const [criticalMaterials, setCriticalMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [m, p, ps, ct, cm] = await Promise.all([
        dashboardDb.getMetrics(),
        dashboardDb.getPiutang(),
        dashboardDb.getProductSales(),
        dashboardDb.getCashflowTrend(),
        dashboardDb.getCriticalMaterials(),
      ])
      setMetrics(m)
      setPiutang(p)
      setProductSales(ps)
      setCashflowTrend(ct)
      setCriticalMaterials(cm)
    }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [toast])
  useEffect(() => { fetch() }, [fetch])
  return { metrics, piutang, productSales, cashflowTrend, criticalMaterials, loading, refetch: fetch }
}
src/lib/hooks/useRad.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { radDb } from '@/lib/db'
import type { Rad, RadItem } from '@/types'
import { useToast } from '@/components/ui/Toaster'
export function useRad() {
  const { toast } = useToast()
  const [data, setData] = useState<(Rad & { items: RadItem[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const fetch = useCallback(async () => {
    setLoading(true)
    try { setData(await radDb.getAll()) }
    catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [toast])
  useEffect(() => { fetch() }, [fetch])
  const create = async (p: Parameters<typeof radDb.create>[0]) => {
    setSaving(true)
    try { await radDb.create(p); await fetch(); toast.success('RAD dibuat') }
    catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }
  const remove = async (id: string) => {
    try { await radDb.remove(id); await fetch(); toast.success('RAD dihapus') }
    catch (e: any) { toast.error(e.message) }
  }
  return { data, loading, saving, create, remove, refetch: fetch }
}
STEP 5: src/components/features/* (Feature Components)
Struktur folder:
src/components/features/
├── dashboard/
│   ├── StatsCards.tsx
│   ├── ProfitTracker.tsx
│   └── DashboardCharts.tsx
├── inventory/
│   ├── MaterialList.tsx
│   ├── RecipeList.tsx
│   └── ProductionList.tsx
├── products/
│   └── ProductList.tsx          (VariantActions sudah digabung di sini)
├── cashflow/
│   └── TransactionList.tsx
├── rad/
│   └── RadList.tsx
└── pricing/
    ├── EcommerceTab.tsx
    └── ResellerTab.tsx

Setiap component hanya terima props (data + callbacks), tidak fetch data sendiri.
Isi semua file di bawah ini:

─── src/components/features/dashboard/StatsCards.tsx ───
'use client'
import StatCard from '@/components/ui/StatCard'
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import type { DashboardMetrics } from '@/types'

interface StatsCardsProps {
  metrics: DashboardMetrics | null
}

export function StatsCards({ metrics }: StatsCardsProps) {
  if (!metrics) return null

  return (
    <div className="stats-grid">
      <StatCard icon={Wallet} title="Saldo" value={formatRupiah(metrics.saldo)} color="indigo" />
      <StatCard icon={TrendingUp} title="Total Pemasukan" value={formatRupiah(metrics.total_income_all)} color="green" />
      <StatCard icon={TrendingDown} title="Total Pengeluaran" value={formatRupiah(metrics.total_expense_all)} color="amber" />
      <StatCard icon={AlertTriangle} title="Stok Kritis" value={String(metrics.critical_stock_count)} subtitle="bahan" color={metrics.critical_stock_count > 0 ? 'red' : 'green'} />
    </div>
  )
}

─── src/components/features/dashboard/ProfitTracker.tsx ───
'use client'
import { useState } from 'react'
import { PiggyBank, Wallet, TrendingUp, Percent, Edit2 } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import NumInput from '@/components/ui/NumInput'
import StatCard from '@/components/ui/StatCard'
import type { DashboardMetrics } from '@/types'

interface ProfitTrackerProps {
  metrics: DashboardMetrics | null
  settings: Record<string, string>
  onSetModal: (key: string, value: string) => Promise<void>
}

export function ProfitTracker({ metrics, settings, onSetModal }: ProfitTrackerProps) {
  const [showModal, setShowModal] = useState(false)
  const [modalDraft, setModalDraft] = useState('')

  if (!metrics) return null

  const modal = Number(settings['modal_bisnis'] || '0')

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>Modal & Profit Tracker</h3>
        {modal > 0 ? (
          <Button variant="outline" size="sm" icon={<Edit2 size={14} />} onClick={() => { setModalDraft(String(modal)); setShowModal(true) }}>
            Edit Modal
          </Button>
        ) : (
          <Button variant="primary" size="sm" icon={<Edit2 size={14} />} onClick={() => { setModalDraft(''); setShowModal(true) }}>
            Set Modal Awal
          </Button>
        )}
      </div>

      <div className="three-col" style={{ margin: 0 }}>
        <StatCard icon={PiggyBank} title="Total Modal Ditanam" value={formatRupiah(modal)} color="violet" />
        <StatCard icon={Wallet} title="Kas Bisnis Saat Ini" value={formatRupiah(metrics.saldo)} color="indigo" />
      </div>
      <div className="three-col" style={{ marginTop: 12 }}>
        <StatCard icon={TrendingUp} title="Profit Bersih" value={formatRupiah(metrics.profit_bersih)} color={metrics.profit_bersih >= 0 ? 'green' : 'red'} />
        <StatCard icon={Percent} title="ROI" value={`${metrics.roi.toFixed(1)}%`} color="violet" />
      </div>

      {metrics.bep_botol > 0 && (
        <div className="card" style={{ marginTop: 16, border: '1px dashed #6366F1', background: '#EEF2FF' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#4338CA' }}>
            BEP Bulan Ini: <strong>{metrics.bep_botol} botol</strong>
          </p>
          <p style={{ fontSize: 12, color: '#6366F1', marginTop: 4 }}>
            Untuk menutup biaya tetap (gaji + marketing + operasional) bulan ini: {formatRupiah(metrics.gaji_bulan + metrics.marketing_bulan + metrics.operasional_bulan)}
          </p>
        </div>
      )}

      {showModal && (
        <Modal title={modal > 0 ? 'Edit Modal Bisnis' : 'Set Modal Awal'} size="sm" onClose={() => setShowModal(false)}>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
            Total uang yang sudah kamu investasikan ke bisnis ini sejak awal (beli bahan, peralatan, dll).
          </p>
          <NumInput value={modalDraft} onChange={setModalDraft} placeholder="Masukkan total modal" />
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" loading={false} onClick={async () => {
              const val = String(parseFloat(modalDraft.replace(/\D/g, '')) || 0)
              await onSetModal('modal_bisnis', val)
              setShowModal(false)
            }}>
              Simpan
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

─── src/components/features/dashboard/DashboardCharts.tsx ───
'use client'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatRupiah } from '@/lib/utils'
import type { ProductSalesData, CashflowMonthlyData } from '@/types'

interface DashboardChartsProps {
  productSales: ProductSalesData[]
  cashflowTrend: CashflowMonthlyData[]
}

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}>
      <p style={{ fontWeight: 700, color: '#334155', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.dataKey === 'total_revenue' ? formatRupiah(p.value) : `${p.value} pcs`}</p>
      ))}
    </div>
  )
}

export function DashboardCharts({ productSales, cashflowTrend }: DashboardChartsProps) {
  if (!productSales.length && !cashflowTrend.length) return null

  return (
    <div className="card" style={{ marginTop: 16 }}>
      {productSales.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Produk Paling Laku</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productSales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="variant_name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<Tip />} />
              <Legend />
              <Bar dataKey="total_qty" name="Terjual (pcs)" fill="#6366F1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="total_revenue" name="Revenue" fill="#A5B4FC" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {cashflowTrend.length > 0 && (
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Tren Cashflow 6 Bulan</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cashflowTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<Tip />} />
              <Legend />
              <Line type="monotone" dataKey="total_income" name="Pemasukan" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="total_expense" name="Pengeluaran" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

─── src/components/features/inventory/MaterialList.tsx ───
'use client'
import { useState } from 'react'
import { Plus, Trash2, Pencil, PackagePlus, Search, Download } from 'lucide-react'
import { formatRupiah, formatNumber } from '@/lib/utils'
import { exportCSV } from '@/lib/csv'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import NumInput from '@/components/ui/NumInput'
import type { RawMaterial } from '@/types'

interface MaterialListProps {
  materials: RawMaterial[]
  loading: boolean
  saving: boolean
  onCreate: (p: { name: string; unit: string; stock: number; min_stock: number }) => Promise<void>
  onUpdate: (id: string, p: { name: string; unit: string; stock: number; min_stock: number }) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onRestock: (p: { materialId: string; qty: number; totalCost: number; recordCashflow: boolean }) => Promise<void>
}

const UNITS = ['ml', 'gram', 'pcs', 'liter', 'kg']

export function MaterialList({ materials, loading, saving, onCreate, onUpdate, onRemove, onRestock }: MaterialListProps) {
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState<RawMaterial | null>(null)
  const [showRestock, setShowRestock] = useState<RawMaterial | null>(null)
  const [form, setForm] = useState({ name: '', unit: 'ml', stock: '', min_stock: '' })
  const [restockForm, setRestockForm] = useState({ qty: '', total_cost: '', catat: true })

  const filtered = materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))

  const handleExport = () => {
    exportCSV(materials, [
      { key: 'name', label: 'Nama Bahan' },
      { key: 'unit', label: 'Satuan' },
      { key: 'stock', label: 'Stok' },
      { key: 'min_stock', label: 'Stok Min' },
      { key: 'cost_per_unit', label: 'Harga/Satuan' },
    ], 'bahan_baku')
  }

  const parseInput = (v: string) => parseFloat(v.replace(/\./g, '')) || 0

  if (loading) return <p style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Memuat data...</p>

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#F8FAFC', borderRadius: 10, padding: '4px 12px', flex: 1, maxWidth: 320 }}>
          <Search size={16} color="#94A3B8" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari bahan..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={handleExport}>CSV</Button>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => { setForm({ name: '', unit: 'ml', stock: '', min_stock: '' }); setShowAdd(true) }}>
            Tambah Bahan
          </Button>
        </div>
      </div>

      <div className="mat-grid">
        {filtered.map(m => {
          const pct = m.stock > 0 && m.min_stock > 0 ? Math.min(100, (m.stock / Math.max(m.stock, m.min_stock * 2)) * 100) : 50
          const isCritical = m.stock <= m.min_stock
          return (
            <div key={m.id} className="card" style={{ position: 'relative', borderColor: isCritical ? '#FCA5A5' : undefined, background: isCritical ? '#FFF5F5' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{m.name}</h4>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>{m.unit} &middot; Rp{formatNumber(m.cost_per_unit)}/{m.unit}</p>
                </div>
                {isCritical && <p style={{ fontSize: 11, color: '#DC2626', fontWeight: 700, margin: 0 }}>KRITIS</p>}
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>Stok: <strong>{formatNumber(m.stock)}</strong></span>
                  <span style={{ color: '#94A3B8' }}>Min: {formatNumber(m.min_stock)}</span>
                </div>
                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: isCritical ? '#EF4444' : '#10B981', borderRadius: 3, transition: 'width .3s' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
                <Button variant="soft" size="sm" icon={<PackagePlus size={14} />} onClick={() => { setShowRestock(m); setRestockForm({ qty: '', total_cost: '', catat: true }) }}>
                  Restock
                </Button>
                <Button variant="soft" size="sm" icon={<Pencil size={14} />} onClick={() => { setShowEdit(m); setForm({ name: m.name, unit: m.unit, stock: String(m.stock), min_stock: String(m.min_stock) }) }}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={async () => { if (confirm('Hapus bahan ini?')) await onRemove(m.id) }} />
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <p style={{ padding: 20, textAlign: 'center', color: '#94A3B8', gridColumn: '1 / -1' }}>Tidak ada bahan.</p>}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Tambah Bahan" size="sm" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Nama Bahan</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="contoh: Bibit Parfum"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Satuan</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {UNITS.map(u => (
                  <button key={u} onClick={() => setForm({ ...form, unit: u })}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid', borderColor: form.unit === u ? '#6366F1' : '#E2E8F0', background: form.unit === u ? '#EEF2FF' : '#fff', color: form.unit === u ? '#4338CA' : '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Stok Awal</label>
              <NumInput value={form.stock} onChange={v => setForm({ ...form, stock: v })} placeholder="0" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Stok Minimum</label>
              <NumInput value={form.min_stock} onChange={v => setForm({ ...form, min_stock: v })} placeholder="0" />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button variant="primary" loading={saving} onClick={async () => {
                await onCreate({ name: form.name, unit: form.unit, stock: parseInput(form.stock), min_stock: parseInput(form.min_stock) })
                setShowAdd(false)
              }}>Simpan</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title="Edit Bahan" size="sm" onClose={() => setShowEdit(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Nama</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Satuan</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {UNITS.map(u => (
                  <button key={u} onClick={() => setForm({ ...form, unit: u })}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid', borderColor: form.unit === u ? '#6366F1' : '#E2E8F0', background: form.unit === u ? '#EEF2FF' : '#fff', color: form.unit === u ? '#4338CA' : '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <NumInput label="Stok" value={form.stock} onChange={v => setForm({ ...form, stock: v })} />
            <NumInput label="Stok Minimum" value={form.min_stock} onChange={v => setForm({ ...form, min_stock: v })} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowEdit(null)}>Batal</Button>
              <Button variant="primary" loading={saving} onClick={async () => {
                await onUpdate(showEdit.id, { name: form.name, unit: form.unit, stock: parseInput(form.stock), min_stock: parseInput(form.min_stock) })
                setShowEdit(null)
              }}>Simpan</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Restock Modal */}
      {showRestock && (
        <Modal title={`Restock ${showRestock.name}`} size="sm" onClose={() => setShowRestock(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#64748B' }}>Stok saat ini: <strong>{formatNumber(showRestock.stock)} {showRestock.unit}</strong></p>
            <NumInput label={`Qty Beli (${showRestock.unit})`} value={restockForm.qty} onChange={v => setRestockForm({ ...restockForm, qty: v })} />
            <NumInput label="Total Harga Beli (Rp)" value={restockForm.total_cost} onChange={v => setRestockForm({ ...restockForm, total_cost: v })} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={restockForm.catat} onChange={e => setRestockForm({ ...restockForm, catat: e.target.checked })}
                style={{ width: 16, height: 16 }} />
              Catat ke Cashflow
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowRestock(null)}>Batal</Button>
              <Button variant="primary" loading={saving} onClick={async () => {
                await onRestock({ materialId: showRestock.id, qty: parseInput(restockForm.qty), totalCost: parseInput(restockForm.total_cost), recordCashflow: restockForm.catat })
                setShowRestock(null)
              }}>Simpan</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

─── src/components/features/inventory/RecipeList.tsx ───
'use client'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import NumInput from '@/components/ui/NumInput'
import type { Recipe, RawMaterial, Variant } from '@/types'

interface RecipeListProps {
  data: (Variant & { recipes: (Recipe & { raw_material: RawMaterial })[] })[]
  materials: RawMaterial[]
  loading: boolean
  saving: boolean
  onCreate: (p: { variant_id: string; raw_material_id: string; quantity_needed: number }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export function RecipeList({ data, materials, loading, saving, onCreate, onRemove }: RecipeListProps) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ variant_id: '', raw_material_id: '', quantity_needed: '' })

  const variantOptions = data.map(v => ({ value: v.id, label: `${v.product?.name || ''} - ${v.name}` }))
  const materialOptions = materials.map(m => ({ value: m.id, label: `${m.name} (${m.unit})` }))

  if (loading) return <p style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Memuat data...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => { setForm({ variant_id: '', raw_material_id: '', quantity_needed: '' }); setShowModal(true) }}>
          Tambah Bahan ke Resep
        </Button>
      </div>

      {data.length === 0 ? (
        <p style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Belum ada resep. Buat varian dulu di Produk & Varian.</p>
      ) : (
        data.map(v => (
          <div key={v.id} className="card" style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
              {v.product?.name} — {v.name} ({formatNumber(v.size_ml)} ml)
            </h4>
            {(!v.recipes || v.recipes.length === 0) ? (
              <p style={{ fontSize: 13, color: '#94A3B8' }}>Belum ada bahan dalam resep ini.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px', fontWeight: 600, color: '#64748B' }}>Bahan</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', fontWeight: 600, color: '#64748B' }}>Qty/Botol</th>
                    <th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {v.recipes.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 4px' }}>{r.raw_material?.name}</td>
                      <td style={{ padding: '8px 4px' }}>{formatNumber(r.quantity_needed)} {r.raw_material?.unit}</td>
                      <td>
                        <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => onRemove(r.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))
      )}

      {showModal && (
        <Modal title="Tambah Bahan ke Resep" size="sm" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Varian</label>
              <Select options={variantOptions} value={form.variant_id} onChange={v => setForm({ ...form, variant_id: v })} placeholder="Pilih varian" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Bahan Baku</label>
              <Select options={materialOptions} value={form.raw_material_id} onChange={v => setForm({ ...form, raw_material_id: v })} placeholder="Pilih bahan" />
            </div>
            <NumInput label="Quantity per Botol" value={form.quantity_needed} onChange={v => setForm({ ...form, quantity_needed: v })} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowModal(false)}>Batal</Button>
              <Button variant="primary" loading={saving} onClick={async () => {
                const qty = parseFloat(form.quantity_needed.replace(/\./g, '')) || 0
                await onCreate({ variant_id: form.variant_id, raw_material_id: form.raw_material_id, quantity_needed: qty })
                setShowModal(false)
              }}>Simpan</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

─── src/components/features/inventory/ProductionList.tsx ───
'use client'
import { useState } from 'react'
import { Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatRupiah, formatNumber } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import NumInput from '@/components/ui/NumInput'
import type { Production, Variant, Recipe, RawMaterial } from '@/types'

interface ProductionListProps {
  productions: (Production & { variant: Variant })[]
  page: number
  total: number
  limit: number
  loading: boolean
  saving: boolean
  onPageChange: (page: number) => void
  onRun: (p: { variantId: string; quantity: number; notes?: string }) => Promise<void>
  variants: (Variant & { recipes: (Recipe & { raw_material: RawMaterial })[] })[]
}

export function ProductionList({ productions, page, total, limit, loading, saving, onPageChange, onRun, variants }: ProductionListProps) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ variant_id: '', quantity: '', notes: '' })
  const [preview, setPreview] = useState<{ name: string; needed: number; available: number; ok: boolean }[]>([])

  const variantOptions = variants.map(v => ({ value: v.id, label: `${v.product?.name || ''} - ${v.name}` }))

  const handlePreview = () => {
    const sel = variants.find(v => v.id === form.variant_id)
    if (!sel || !sel.recipes) return setPreview([])
    const qty = parseInt(form.quantity.replace(/\D/g, '')) || 0
    setPreview(sel.recipes.map(r => ({
      name: r.raw_material?.name || '?',
      needed: r.quantity_needed * qty,
      available: r.raw_material?.stock || 0,
      ok: (r.raw_material?.stock || 0) >= r.quantity_needed * qty,
    })))
  }

  const totalPages = Math.ceil(total / limit)

  if (loading) return <p style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Memuat data...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Riwayat Produksi</h3>
        <Button variant="primary" size="sm" icon={<Zap size={14} />} onClick={() => { setForm({ variant_id: '', quantity: '', notes: '' }); setPreview([]); setShowModal(true) }}>
          Jalankan Produksi
        </Button>
      </div>

      {productions.length === 0 ? (
        <p style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Belum ada riwayat produksi.</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ textAlign: 'left', padding: 10, fontWeight: 600, color: '#64748B' }}>Tanggal</th>
                <th style={{ textAlign: 'left', padding: 10, fontWeight: 600, color: '#64748B' }}>Varian</th>
                <th style={{ textAlign: 'left', padding: 10, fontWeight: 600, color: '#64748B' }}>Qty</th>
                <th style={{ textAlign: 'left', padding: 10, fontWeight: 600, color: '#64748B' }}>Biaya</th>
                <th style={{ textAlign: 'left', padding: 10, fontWeight: 600, color: '#64748B' }}>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {productions.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: 10 }}>{new Date(p.produced_at).toLocaleDateString('id-ID')}</td>
                  <td style={{ padding: 10, fontWeight: 600 }}>{p.variant?.name}</td>
                  <td style={{ padding: 10 }}>{formatNumber(p.quantity)} pcs</td>
                  <td style={{ padding: 10 }}>{formatRupiah(p.total_cost)}</td>
                  <td style={{ padding: 10, color: '#94A3B8' }}>{p.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
              <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />} onClick={() => onPageChange(page - 1)} disabled={page <= 1} />
              <span style={{ fontSize: 13, color: '#64748B' }}>Hal {page} / {totalPages}</span>
              <Button variant="ghost" size="sm" icon={<ChevronRight size={14} />} onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} />
            </div>
          )}
        </>
      )}

      {showModal && (
        <Modal title="Jalankan Produksi" size="md" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Varian</label>
              <Select options={variantOptions} value={form.variant_id} onChange={v => setForm({ ...form, variant_id: v })} placeholder="Pilih varian" />
            </div>
            <NumInput label="Jumlah Produksi (pcs)" value={form.quantity} onChange={v => setForm({ ...form, quantity: v })} />
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Catatan (opsional)</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="contoh: batch minggu ini"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
            </div>

            <Button variant="outline" size="sm" onClick={handlePreview}>Cek Kebutuhan Bahan</Button>

            {preview.length > 0 && (
              <div className="card" style={{ background: '#F8FAFC' }}>
                <h5 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Preview Kebutuhan</h5>
                <table style={{ width: '100%', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ textAlign: 'left', padding: 6, fontWeight: 600 }}>Bahan</th>
                      <th style={{ textAlign: 'left', padding: 6, fontWeight: 600 }}>Dibutuhkan</th>
                      <th style={{ textAlign: 'left', padding: 6, fontWeight: 600 }}>Tersedia</th>
                      <th style={{ textAlign: 'left', padding: 6, fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: 6 }}>{p.name}</td>
                        <td style={{ padding: 6 }}>{formatNumber(p.needed)}</td>
                        <td style={{ padding: 6 }}>{formatNumber(p.available)}</td>
                        <td style={{ padding: 6, color: p.ok ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                          {p.ok ? 'OK Cukup' : 'X Kurang'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowModal(false)}>Batal</Button>
              <Button variant="primary" loading={saving} onClick={async () => {
                const qty = parseInt(form.quantity.replace(/\D/g, '')) || 0
                await onRun({ variantId: form.variant_id, quantity: qty, notes: form.notes || undefined })
                setShowModal(false)
              }}>Jalankan Produksi</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

─── src/components/features/products/ProductList.tsx ───
'use client'
import { useState } from 'react'
import { Plus, Trash2, Edit2, Search, Download, ShoppingBag, Send, Wallet } from 'lucide-react'
import { formatRupiah, formatNumber } from '@/lib/utils'
import { exportCSV } from '@/lib/csv'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import NumInput from '@/components/ui/NumInput'
import type { Product, Variant, Reseller, Distribution } from '@/types'

interface ProductListProps {
  products: (Product & { variants: (Variant & { total_produced?: number; total_sold?: number })[] })[]
  resellers: Reseller[]
  distributions: (Distribution & { variant?: Variant; reseller?: Reseller })[]
  loading: boolean
  saving: boolean
  onCreateProduct: (name: string, description?: string) => Promise<void>
  onUpdateProduct: (id: string, p: { name: string; description?: string }) => Promise<void>
  onDeleteProduct: (id: string) => Promise<void>
  onCreateVariant: (p: { product_id: string; name: string; size_ml: number; selling_price: number; stock_own: number }) => Promise<void>
  onUpdateVariant: (id: string, p: { name: string; size_ml: number; selling_price: number }) => Promise<void>
  onDeleteVariant: (id: string) => Promise<void>
  onSale: (p: { variantId: string; quantity: number; unitPrice: number; recordCashflow: boolean }) => Promise<void>
  onDistribute: (p: { variantId: string; resellerId: string; quantity: number; pricePerUnit: number }) => Promise<void>
  onResellerPayment: (p: { distributionId: string; quantity: number; amount: number; recordCashflow: boolean }) => Promise<void>
  onCreateReseller: (name: string) => Promise<Reseller>
}

type Mode = 'add-product' | 'edit-product' | 'add-variant' | 'edit-variant' | 'sale' | 'distribute' | 'payment' | null

export function ProductList(props: ProductListProps) {
  const { products, resellers, distributions, loading, saving } = props
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<Mode>(null)
  const [selProduct, setSelProduct] = useState<Product | null>(null)
  const [selVariant, setSelVariant] = useState<Variant | null>(null)
  const [pForm, setPForm] = useState({ name: '', description: '' })
  const [vForm, setVForm] = useState({ name: '', size_ml: '', selling_price: '', stock_own: '' })
  const [saleForm, setSaleForm] = useState({ qty: '', harga: '', catat: true })
  const [distForm, setDistForm] = useState({ qty: '', harga: '', reseller_id: '', reseller_name: '' })
  const [resellerInput, setResellerInput] = useState('')
  const [payForm, setPayForm] = useState({ qty: '', harga: '', dist_id: '', catat: true })

  const parseInput = (v: string) => parseFloat(v.replace(/\./g, '')) || 0

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.variants || []).some(v => v.name.toLowerCase().includes(search.toLowerCase()))
  )

  const handleExport = () => {
    const rows: any[] = []
    products.forEach(p => (p.variants || []).forEach(v => rows.push({
      produk: p.name, varian: v.name, size: `${v.size_ml}ml`, harga: v.selling_price, stok_sendiri: v.stock_own, stok_reseller: v.stock_reseller
    })))
    exportCSV(rows, [
      { key: 'produk', label: 'Produk' }, { key: 'varian', label: 'Varian' }, { key: 'size', label: 'Ukuran' },
      { key: 'harga', label: 'Harga Jual' }, { key: 'stok_sendiri', label: 'Stok Sendiri' }, { key: 'stok_reseller', label: 'Stok Reseller' }
    ], 'produk_varian')
  }

  if (loading) return <p style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Memuat data...</p>

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#F8FAFC', borderRadius: 10, padding: '4px 12px', flex: 1, maxWidth: 320 }}>
          <Search size={16} color="#94A3B8" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk/varian..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={handleExport}>CSV</Button>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => { setPForm({ name: '', description: '' }); setMode('add-product') }}>
            Tambah Produk
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Belum ada produk.</p>
      ) : (
        filtered.map(p => (
          <div key={p.id} className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{p.name}</h3>
                {p.description && <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>{p.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => { setSelProduct(p); setVForm({ name: '', size_ml: '', selling_price: '', stock_own: '' }); setMode('add-variant') }}>
                  + Varian
                </Button>
                <Button variant="soft" size="sm" icon={<Edit2 size={14} />} onClick={() => { setSelProduct(p); setPForm({ name: p.name, description: p.description || '' }); setMode('edit-product') }}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={async () => {
                  if (confirm(`Hapus produk "${p.name}" dan semua variannya?`)) await props.onDeleteProduct(p.id)
                }} />
              </div>
            </div>

            <div className="stats-grid" style={{ margin: 0 }}>
              {(p.variants || []).map(v => (
                <div key={v.id} className="card" style={{ padding: 14, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{v.name}</h4>
                      <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0' }}>{formatNumber(v.size_ml)} ml</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#4338CA', margin: '4px 0 0' }}>{formatRupiah(v.selling_price)}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button variant="soft" size="sm" onClick={() => { setSelProduct(p); setSelVariant(v); setVForm({ name: v.name, size_ml: String(v.size_ml), selling_price: String(v.selling_price), stock_own: String(v.stock_own) }); setMode('edit-variant') }}>
                        <Edit2 size={12} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={async () => {
                        if (confirm(`Hapus varian "${v.name}"?`)) await props.onDeleteVariant(v.id)
                      }}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: '#64748B' }}>
                    <div><span style={{ fontWeight: 600 }}>Stok Sendiri</span><br /><strong style={{ fontSize: 14, color: '#334155' }}>{v.stock_own}</strong></div>
                    <div><span style={{ fontWeight: 600 }}>Stok Reseller</span><br /><strong style={{ fontSize: 14, color: '#334155' }}>{v.stock_reseller}</strong></div>
                    {v.total_sold !== undefined && (
                      <div><span style={{ fontWeight: 600 }}>Terjual</span><br /><strong style={{ fontSize: 14, color: '#334155' }}>{v.total_sold}</strong></div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <Button variant="primary" size="sm" icon={<ShoppingBag size={13} />} onClick={() => { setSelVariant(v); setSaleForm({ qty: '', harga: String(v.selling_price), catat: true }); setMode('sale') }}>
                      Jual
                    </Button>
                    <Button variant="soft" size="sm" icon={<Send size={13} />} onClick={() => { setSelVariant(v); setDistForm({ qty: '', harga: '', reseller_id: '', reseller_name: '' }); setResellerInput(''); setMode('distribute') }}
                      style={{ background: '#EEF2FF', borderColor: '#C7D2FE', color: '#4338CA' }}>
                      Dist
                    </Button>
                    <Button variant="soft" size="sm" icon={<Wallet size={13} />} onClick={() => { setSelVariant(v); setPayForm({ qty: '', harga: '', dist_id: '', catat: true }); setMode('payment') }}
                      style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}>
                      Bayar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add Product Modal */}
      {mode === 'add-product' && (
        <Modal title="Tambah Produk" size="sm" onClose={() => setMode(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Nama Produk</label>
              <input value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} placeholder="contoh: Aqua Kiss"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Deskripsi (opsional)</label>
              <input value={pForm.description} onChange={e => setPForm({ ...pForm, description: e.target.value })} placeholder="Keterangan singkat"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setMode(null)}>Batal</Button>
              <Button variant="primary" loading={saving} onClick={async () => {
                await props.onCreateProduct(pForm.name, pForm.description || undefined)
                setMode(null)
              }}>Simpan</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Product Modal */}
      {mode === 'edit-product' && selProduct && (
        <Modal title="Edit Produk" size="sm" onClose={() => setMode(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Nama Produk</label>
              <input value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Deskripsi</label>
              <input value={pForm.description} onChange={e => setPForm({ ...pForm, description: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setMode(null)}>Batal</Button>
              <Button variant="primary" loading={saving} onClick={async () => {
                await props.onUpdateProduct(selProduct.id, { name: pForm.name, description: pForm.description || undefined })
                setMode(null)
              }}>Simpan</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add/Edit Variant Modal */}
      {(mode === 'add-variant' || mode === 'edit-variant') && (
        <Modal title={mode === 'add-variant' ? 'Tambah Varian' : 'Edit Varian'} size="sm" onClose={() => setMode(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Nama Varian</label>
              <input value={vForm.name} onChange={e => setVForm({ ...vForm, name: e.target.value })} placeholder="contoh: Lace 35ml"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
            </div>
            <NumInput label="Ukuran (ml)" value={vForm.size_ml} onChange={v => setVForm({ ...vForm, size_ml: v })} />
            <NumInput label="Harga Jual (Rp)" value={vForm.selling_price} onChange={v => setVForm({ ...vForm, selling_price: v })} />
            {mode === 'add-variant' && (
              <NumInput label="Stok Awal Sendiri" value={vForm.stock_own} onChange={v => setVForm({ ...vForm, stock_own: v })} />
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setMode(null)}>Batal</Button>
              <Button variant="primary" loading={saving} onClick={async () => {
                const data = { name: vForm.name, size_ml: parseInput(vForm.size_ml), selling_price: parseInput(vForm.selling_price) }
                if (mode === 'edit-variant' && selVariant) {
                  await props.onUpdateVariant(selVariant.id, data)
                } else if (selProduct) {
                  await props.onCreateVariant({ ...data, product_id: selProduct.id, stock_own: parseInput(vForm.stock_own) })
                }
                setMode(null)
              }}>Simpan</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Sale Modal */}
      {mode === 'sale' && selVariant && (
        <Modal title={`Jual ${selVariant.name}`} size="sm" onClose={() => setMode(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#64748B' }}>Stok sendiri tersedia: <strong>{selVariant.stock_own} pcs</strong></p>
            <NumInput label="Jumlah Terjual" value={saleForm.qty} onChange={v => setSaleForm({ ...saleForm, qty: v })} />
            <NumInput label="Harga Jual per Pcs (Rp)" value={saleForm.harga} onChange={v => setSaleForm({ ...saleForm, harga: v })} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={saleForm.catat} onChange={e => setSaleForm({ ...saleForm, catat: e.target.checked })} style={{ width: 16, height: 16 }} />
              Catat ke Cashflow
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setMode(null)}>Batal</Button>
              <Button variant="primary" loading={saving} onClick={async () => {
                await props.onSale({
                  variantId: selVariant.id,
                  quantity: parseInt(saleForm.qty.replace(/\D/g, '')) || 0,
                  unitPrice: parseInput(saleForm.harga),
                  recordCashflow: saleForm.catat,
                })
                setMode(null)
              }}>Simpan</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Distribution Modal */}
      {mode === 'distribute' && selVariant && (
        <Modal title={`Distribusi ${selVariant.name}`} size="sm" onClose={() => setMode(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#64748B' }}>Stok sendiri: <strong>{selVariant.stock_own} pcs</strong></p>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Reseller</label>
              <div style={{ position: 'relative' }}>
                <input value={resellerInput} onChange={e => { setResellerInput(e.target.value); setDistForm({ ...distForm, reseller_name: e.target.value }) }}
                  placeholder="Nama reseller (bikin baru atau pilih yang ada)"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
                {resellerInput && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,.1)', zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
                    {resellers.filter(r => r.name.toLowerCase().includes(resellerInput.toLowerCase())).map(r => (
                      <div key={r.id} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #F1F5F9' }}
                        onClick={() => { setDistForm({ ...distForm, reseller_id: r.id, reseller_name: r.name }); setResellerInput(r.name) }}>
                        {r.name}
                      </div>
                    ))}
                    <div style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: '#6366F1', fontWeight: 600 }}
                      onClick={async () => {
                        const r = await props.onCreateReseller(resellerInput.trim())
                        setDistForm({ ...distForm, reseller_id: r.id, reseller_name: r.name })
                        setResellerInput(r.name)
                      }}>
                      + Buat "{resellerInput}"
                    </div>
                  </div>
                )}
              </div>
            </div>
            <NumInput label="Jumlah Dikirim (pcs)" value={distForm.qty} onChange={v => setDistForm({ ...distForm, qty: v })} />
            <NumInput label="Harga ke Reseller per Pcs (Rp)" value={distForm.harga} onChange={v => setDistForm({ ...distForm, harga: v })} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setMode(null)}>Batal</Button>
              <Button variant="primary" loading={saving} onClick={async () => {
                await props.onDistribute({
                  variantId: selVariant.id,
                  resellerId: distForm.reseller_id,
                  quantity: parseInt(distForm.qty.replace(/\D/g, '')) || 0,
                  pricePerUnit: parseInput(distForm.harga),
                })
                setMode(null)
              }}>Distribusi</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reseller Payment Modal */}
      {mode === 'payment' && selVariant && (
        <Modal title={`Reseller Bayar — ${selVariant.name}`} size="sm" onClose={() => setMode(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#64748B' }}>Pilih distribusi yang dibayar:</p>
            {distributions
              .filter(d => d.variant_id === selVariant.id && d.status === 'active')
              .map(d => (
                <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid', borderColor: payForm.dist_id === d.id ? '#6366F1' : '#E2E8F0', borderRadius: 8, cursor: 'pointer', background: payForm.dist_id === d.id ? '#EEF2FF' : '#fff' }}>
                  <input type="radio" checked={payForm.dist_id === d.id} onChange={() => setPayForm({ ...payForm, dist_id: d.id })}
                    style={{ width: 14, height: 14, accentColor: '#6366F1' }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{d.reseller?.name} — {d.quantity} pcs @{formatRupiah(d.price_per_unit)}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{new Date(d.distributed_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </label>
              ))}
            {payForm.dist_id && (
              <>
                <NumInput label="Jumlah Laku (pcs)" value={payForm.qty} onChange={v => setPayForm({ ...payForm, qty: v })} />
                <NumInput label="Total Dibayar (Rp)" value={payForm.harga} onChange={v => setPayForm({ ...payForm, harga: v })} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={payForm.catat} onChange={e => setPayForm({ ...payForm, catat: e.target.checked })}
                    style={{ width: 16, height: 16 }} /> Catat ke Cashflow
                </label>
              </>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setMode(null)}>Batal</Button>
              <Button variant="primary" loading={saving} onClick={async () => {
                await props.onResellerPayment({
                  distributionId: payForm.dist_id,
                  quantity: parseInt(payForm.qty.replace(/\D/g, '')) || 0,
                  amount: parseInput(payForm.harga),
                  recordCashflow: payForm.catat,
                })
                setMode(null)
              }}>Simpan</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

─── src/components/features/cashflow/TransactionList.tsx ───
'use client'
import { useState } from 'react'
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, Printer, Download, Wallet } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { exportCSV } from '@/lib/csv'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import NumInput from '@/components/ui/NumInput'
import Select from '@/components/ui/Select'
import type { Cashflow, InitialBalance } from '@/types'

interface TransactionListProps {
  data: Cashflow[]
  period: 'daily' | 'weekly' | 'monthly' | 'all'
  page: number
  total: number
  limit: number
  loading: boolean
  saving: boolean
  balance: InitialBalance | null
  onPeriodChange: (p: 'daily' | 'weekly' | 'monthly' | 'all') => void
  onPageChange: (p: number) => void
  onAdd: (p: { type: 'income' | 'expense'; category: string; amount: number; description?: string; date?: string }) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onSetBalance: (amount: number) => Promise<void>
}

const PERIODS = [
  { value: 'daily' as const, label: 'Hari Ini' },
  { value: 'weekly' as const, label: 'Minggu Ini' },
  { value: 'monthly' as const, label: 'Bulan Ini' },
  { value: 'all' as const, label: 'Semua' },
]
const INCOME_CATS = ['Penjualan', 'Reseller', 'Dropship', 'Lainnya']
const EXPENSE_CATS = ['Produksi', 'Gaji Karyawan', 'Marketing', 'Packaging', 'Ongkir', 'Operasional', 'Lainnya']

export function TransactionList(props: TransactionListProps) {
  const { data, period, page, total, limit, loading, saving, balance } = props
  const [showAdd, setShowAdd] = useState(false)
  const [showBalance, setShowBalance] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ type: 'income' as 'income' | 'expense', category: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) })
  const [balanceForm, setBalanceForm] = useState('')

  const parseInput = (v: string) => parseFloat(v.replace(/\./g, '')) || 0
  const totalPages = Math.ceil(total / limit)
  const incomeTotal = data.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenseTotal = data.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const selisih = incomeTotal - expenseTotal

  const filtered = data.filter(t =>
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  )

  const cats = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS

  const handlePrint = () => {
    const filterLabel = PERIODS.find(p => p.value === period)?.label || 'Semua'
    const printWin = window.open('', '_blank')
    if (!printWin) return
    const rows = filtered.map(t => `
      <tr><td>${new Date(t.transaction_date).toLocaleDateString('id-ID')}</td>
      <td>${t.category}</td><td>${t.description || '-'}</td>
      <td style="color:${t.type === 'income' ? '#10B981' : '#EF4444'}">${t.type === 'income' ? '+' : '-'}${formatRupiah(t.amount)}</td></tr>
    `).join('')
    printWin.document.write(`
      <html><head><title>Laporan Cashflow</title><style>
        body{font-family:sans-serif;padding:30px} h1{font-size:20px} table{width:100%;border-collapse:collapse;margin-top:16px}
        th,td{border-bottom:1px solid #ddd;padding:8px 12px;text-align:left;font-size:13px}
      </style></head><body>
        <h1>Laporan Cashflow - ${filterLabel}</h1>
        <p>Pemasukan: ${formatRupiah(incomeTotal)} | Pengeluaran: ${formatRupiah(expenseTotal)} | Selisih: ${formatRupiah(selisih)}</p>
        <table><thead><tr><th>Tanggal</th><th>Kategori</th><th>Deskripsi</th><th>Nominal</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>
    `)
    printWin.print()
  }

  const handleExport = () => {
    exportCSV(filtered, [
      { key: 'type', label: 'Tipe' }, { key: 'category', label: 'Kategori' },
      { key: 'amount', label: 'Nominal' }, { key: 'description', label: 'Deskripsi' },
      { key: 'transaction_date', label: 'Tanggal' },
    ], 'cashflow')
  }

  if (loading) return <p style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Memuat data...</p>

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wallet size={20} color="#4338CA" />
            <div>
              <p style={{ fontSize: 12, color: '#6366F1', margin: 0 }}>Saldo Rekening</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#4338CA', margin: 0 }}>{formatRupiah((balance?.amount || 0) + selisih)}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setBalanceForm(String(balance?.amount || '')); setShowBalance(true) }}>
            {balance ? 'Edit Saldo Awal' : 'Set Saldo Awal'}
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => props.onPeriodChange(p.value)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              borderColor: period === p.value ? '#6366F1' : '#E2E8F0',
              background: period === p.value ? '#EEF2FF' : '#fff',
              color: period === p.value ? '#4338CA' : '#64748B',
            }}>{p.label}</button>
        ))}
      </div>

      <div className="three-col" style={{ marginBottom: 16 }}>
        <div className="card"><p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Pemasukan</p><p style={{ fontSize: 16, fontWeight: 700, color: '#10B981', margin: '4px 0 0' }}>{formatRupiah(incomeTotal)}</p></div>
        <div className="card"><p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Pengeluaran</p><p style={{ fontSize: 16, fontWeight: 700, color: '#EF4444', margin: '4px 0 0' }}>{formatRupiah(expenseTotal)}</p></div>
        <div className="card"><p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Selisih</p><p style={{ fontSize: 16, fontWeight: 700, color: selisih >= 0 ? '#10B981' : '#EF4444', margin: '4px 0 0' }}>{formatRupiah(selisih)}</p></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#F8FAFC', borderRadius: 10, padding: '4px 12px', width: 240 }}>
          <Search size={16} color="#94A3B8" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari transaksi..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" icon={<Printer size={14} />} onClick={handlePrint}>Cetak</Button>
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={handleExport}>CSV</Button>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => { setForm({ type: 'income', category: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) }); setShowAdd(true) }}>
            Tambah Transaksi
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Tidak ada transaksi.</p>
      ) : (
        <div>
          {filtered.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F1F5F9', fontSize: 13 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: t.type === 'income' ? '#ECFDF5' : '#FEF2F2', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: t.type === 'income' ? '#059669' : '#DC2626' }}>
                    {t.type === 'income' ? 'IN' : 'OUT'}
                  </span>
                  <strong>{t.category}</strong>
                </div>
                {t.description && <p style={{ margin: '4px 0 0', color: '#94A3B8' }}>{t.description}</p>}
                <p style={{ margin: '2px 0 0', color: '#94A3B8', fontSize: 11 }}>{new Date(t.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: t.type === 'income' ? '#10B981' : '#EF4444' }}>
                  {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                </span>
                <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => props.onRemove(t.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />} onClick={() => props.onPageChange(page - 1)} disabled={page <= 1} />
          <span style={{ fontSize: 13, color: '#64748B' }}>Hal {page} / {totalPages}</span>
          <Button variant="ghost" size="sm" icon={<ChevronRight size={14} />} onClick={() => props.onPageChange(page + 1)} disabled={page >= totalPages} />
        </div>
      )}

      {showAdd && (
        <Modal title="Tambah Transaksi" size="sm" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setForm({ ...form, type: 'income', category: '' })}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid', borderColor: form.type === 'income' ? '#10B981' : '#E2E8F0', background: form.type === 'income' ? '#ECFDF5' : '#fff', color: form.type === 'income' ? '#059669' : '#64748B', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Pemasukan
              </button>
              <button onClick={() => setForm({ ...form, type: 'expense', category: '' })}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid', borderColor: form.type === 'expense' ? '#EF4444' : '#E2E8F0', background: form.type === 'expense' ? '#FEF2F2' : '#fff', color: form.type === 'expense' ? '#DC2626' : '#64748B', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Pengeluaran
              </button>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Kategori</label>
              <Select options={cats.map(c => ({ value: c, label: c }))} value={form.category} onChange={v => setForm({ ...form, category: v })} placeholder="Pilih kategori" />
            </div>
            <NumInput label="Nominal (Rp)" value={form.amount} onChange={v => setForm({ ...form, amount: v })} />
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Deskripsi (opsional)</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Tanggal</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button variant="primary" loading={saving} onClick={async () => {
                await props.onAdd({ type: form.type, category: form.category, amount: parseInput(form.amount), description: form.description || undefined, date: form.date })
                setShowAdd(false)
              }}>Simpan</Button>
            </div>
          </div>
        </Modal>
      )}

      {showBalance && (
        <Modal title="Set Saldo Awal" size="sm" onClose={() => setShowBalance(false)}>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
            Total uang yang ada di rekening/kas kamu sekarang (sebelum pakai aplikasi). Input sekali saja.
          </p>
          <NumInput value={balanceForm} onChange={setBalanceForm} placeholder="Saldo awal" />
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowBalance(false)}>Batal</Button>
            <Button variant="primary" loading={false} onClick={async () => {
              await props.onSetBalance(parseFloat(balanceForm.replace(/\D/g, '')) || 0)
              setShowBalance(false)
            }}>Simpan</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

─── src/components/features/rad/RadList.tsx ───
'use client'
import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatRupiah, formatNumber } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import NumInput from '@/components/ui/NumInput'
import type { Rad, RadItem } from '@/types'

interface RadListProps {
  data: (Rad & { items: RadItem[] })[]
  loading: boolean
  saving: boolean
  onCreate: (p: {
    title: string; batch_quantity: number; selling_price: number; salary_cost: number; other_cost: number
    items: { name: string; total_qty: number; unit: string; total_cost: number; usage_per_bottle: number }[]
  }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

const UNITS = ['ml', 'gram', 'pcs', 'liter', 'kg']
const STARTER_ITEMS = [
  { name: 'Bibit Parfum', total_qty: '', unit: 'ml', total_cost: '', usage_per_bottle: '20' },
  { name: 'Absolut/Alkohol', total_qty: '', unit: 'ml', total_cost: '', usage_per_bottle: '15' },
  { name: 'Botol', total_qty: '', unit: 'pcs', total_cost: '', usage_per_bottle: '1' },
  { name: 'Stiker', total_qty: '', unit: 'pcs', total_cost: '', usage_per_bottle: '1' },
  { name: 'Box', total_qty: '', unit: 'pcs', total_cost: '', usage_per_bottle: '1' },
]

interface ItemForm { name: string; total_qty: string; unit: string; total_cost: string; usage_per_bottle: string }

function calcHppPerBottle(item: ItemForm) {
  const qty = parseFloat(item.total_qty) || 0
  const cost = parseFloat(item.total_cost) || 0
  const usage = parseFloat(item.usage_per_bottle) || 0
  return qty === 0 ? 0 : (cost / qty) * usage
}

function calcHpp(items: RadItem[]) {
  return items.reduce((s, i) => s + (i.total_qty > 0 ? (i.total_cost / i.total_qty) * i.usage_per_bottle : 0), 0)
}

export function RadList({ data, loading, saving, onCreate, onRemove }: RadListProps) {
  const [showModal, setShowModal] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [title, setTitle] = useState('')
  const [batchQty, setBatchQty] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [salaryCost, setSalaryCost] = useState('')
  const [otherCost, setOtherCost] = useState('')
  const [items, setItems] = useState<ItemForm[]>(STARTER_ITEMS.map(i => ({ ...i })))

  const parseInput = (v: string) => parseFloat(v.replace(/\./g, '')) || 0
  const addItem = () => setItems([...items, { name: '', total_qty: '', unit: 'pcs', total_cost: '', usage_per_bottle: '' }])
  const removeItem = (i: number) => { const n = [...items]; n.splice(i, 1); setItems(n) }

  const totalHpp = items.reduce((s, i) => s + calcHppPerBottle(i), 0)
  const qty = parseInt(batchQty.replace(/\D/g, '')) || 0
  const gaji = parseInput(salaryCost)
  const lain = parseInput(otherCost)
  const price = parseInput(sellingPrice)
  const totalRevenue = price * qty
  const totalHppBatch = totalHpp * qty
  const netProfit = totalRevenue - totalHppBatch - gaji - lain

  if (loading) return <p style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Memuat data...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => {
          setTitle(''); setBatchQty(''); setSellingPrice(''); setSalaryCost(''); setOtherCost('')
          setItems(STARTER_ITEMS.map(i => ({ ...i })))
          setShowModal(true)
        }}>+ Buat RAD Baru</Button>
      </div>

      {data.length === 0 ? (
        <p style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Belum ada RAD.</p>
      ) : (
        data.map(rad => {
          const hpp = calcHpp(rad.items || [])
          const margin = rad.selling_price - hpp
          return (
            <div key={rad.id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => { const s = new Set(expanded); s.has(rad.id) ? s.delete(rad.id) : s.add(rad.id); setExpanded(s) }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{rad.title}</h4>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>
                    Batch {rad.batch_quantity} pcs &middot; HPP/botol {formatRupiah(hpp)} &middot; {new Date(rad.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={e => { e.stopPropagation(); onRemove(rad.id) }} />
                  {expanded.has(rad.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              {expanded.has(rad.id) && (
                <div style={{ marginTop: 16, padding: 16, background: '#F8FAFC', borderRadius: 8 }}>
                  <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Detail Biaya per Botol</h5>
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ textAlign: 'left', padding: 6 }}>Item</th>
                        <th style={{ textAlign: 'right', padding: 6 }}>Biaya/Botol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(rad.items || []).map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: 6 }}>{item.name}</td>
                          <td style={{ textAlign: 'right', padding: 6 }}>
                            {formatRupiah(item.total_qty > 0 ? (item.total_cost / item.total_qty) * item.usage_per_bottle : 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="three-col" style={{ marginTop: 16 }}>
                    <div><span style={{ fontSize: 11, color: '#94A3B8' }}>HPP/Botol</span><p style={{ fontWeight: 700, fontSize: 15, margin: '4px 0 0' }}>{formatRupiah(hpp)}</p></div>
                    <div><span style={{ fontSize: 11, color: '#94A3B8' }}>Harga Jual</span><p style={{ fontWeight: 700, fontSize: 15, margin: '4px 0 0' }}>{formatRupiah(rad.selling_price)}</p></div>
                    <div><span style={{ fontSize: 11, color: '#94A3B8' }}>Margin/Botol</span><p style={{ fontWeight: 700, fontSize: 15, margin: '4px 0 0', color: margin > 0 ? '#10B981' : '#EF4444' }}>{formatRupiah(margin)}</p></div>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}

      {showModal && (
        <Modal title="Buat RAD Baru" size="lg" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul RAD (contoh: Batch Mei 2026)"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}><NumInput label="Jumlah Batch (pcs)" value={batchQty} onChange={setBatchQty} /></div>
              <div style={{ flex: 1 }}><NumInput label="Harga Jual per Pcs (Rp)" value={sellingPrice} onChange={setSellingPrice} /></div>
            </div>

            <div className="card" style={{ background: '#F8FAFC', maxHeight: 280, overflowY: 'auto' }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: 2, minWidth: 120 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Nama</label>
                    <input value={item.name} onChange={e => { const n = [...items]; n[i].name = e.target.value; setItems(n) }}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 80 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Qty Beli</label>
                    <NumInput value={item.total_qty} onChange={v => { const n = [...items]; n[i].total_qty = v; setItems(n) }} />
                  </div>
                  <div style={{ width: 60 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Satuan</label>
                    <select value={item.unit} onChange={e => { const n = [...items]; n[i].unit = e.target.value; setItems(n) }}
                      style={{ width: '100%', padding: '6px 4px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12 }}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Harga Total (Rp)</label>
                    <NumInput value={item.total_cost} onChange={v => { const n = [...items]; n[i].total_cost = v; setItems(n) }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 80 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Pakai/Botol</label>
                    <NumInput value={item.usage_per_bottle} onChange={v => { const n = [...items]; n[i].usage_per_bottle = v; setItems(n) }} />
                  </div>
                  <div style={{ paddingBottom: 4 }}>
                    <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => removeItem(i)} />
                  </div>
                </div>
              ))}
              <Button variant="soft" size="sm" icon={<Plus size={13} />} onClick={addItem} style={{ marginTop: 4 }}>Tambah Item</Button>
            </div>

            <div className="card" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div className="three-col" style={{ margin: 0 }}>
                <div><span style={{ fontSize: 11, color: '#64748B' }}>HPP/Botol</span><p style={{ fontWeight: 800, fontSize: 16, margin: '2px 0 0', color: '#059669' }}>{formatRupiah(totalHpp)}</p></div>
                <div><span style={{ fontSize: 11, color: '#64748B' }}>Saran Harga (30%)</span><p style={{ fontWeight: 800, fontSize: 16, margin: '2px 0 0', color: '#4338CA' }}>{formatRupiah(totalHpp > 0 ? totalHpp * 1.3 : 0)}</p></div>
                <div><span style={{ fontSize: 11, color: '#64748B' }}>Saran Harga (50%)</span><p style={{ fontWeight: 800, fontSize: 16, margin: '2px 0 0', color: '#4338CA' }}>{formatRupiah(totalHpp > 0 ? totalHpp * 1.5 : 0)}</p></div>
              </div>
              {qty > 0 && (
                <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Profit untuk {qty} pcs:</p>
                  <div style={{ display: 'flex', gap: 24, marginTop: 8, fontSize: 13 }}>
                    <div><span style={{ color: '#64748B' }}>Revenue</span><p style={{ fontWeight: 700, margin: '2px 0' }}>{formatRupiah(totalRevenue)}</p></div>
                    <div><span style={{ color: '#64748B' }}>HPP Total</span><p style={{ fontWeight: 700, margin: '2px 0' }}>{formatRupiah(totalHppBatch)}</p></div>
                    <div><span style={{ color: '#64748B' }}>Net Profit</span><p style={{ fontWeight: 700, margin: '2px 0', color: netProfit >= 0 ? '#10B981' : '#EF4444' }}>{formatRupiah(netProfit)}</p></div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <NumInput label="Gaji Karyawan (opsional)" value={salaryCost} onChange={setSalaryCost} />
              <NumInput label="Biaya Lain (opsional)" value={otherCost} onChange={setOtherCost} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowModal(false)}>Batal</Button>
              <Button variant="primary" loading={saving} onClick={async () => {
                await onCreate({
                  title,
                  batch_quantity: parseInt(batchQty.replace(/\D/g, '')) || 0,
                  selling_price: price,
                  salary_cost: gaji,
                  other_cost: lain,
                  items: items.map(i => ({
                    name: i.name,
                    total_qty: parseInput(i.total_qty),
                    unit: i.unit,
                    total_cost: parseInput(i.total_cost),
                    usage_per_bottle: parseInput(i.usage_per_bottle),
                  })),
                })
                setShowModal(false)
              }}>Simpan RAD</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

─── src/components/features/pricing/EcommerceTab.tsx ───
'use client'
import { useState } from 'react'
import { formatRupiah } from '@/lib/utils'
import NumInput from '@/components/ui/NumInput'

const PLATFORMS = [
  { id: 'shopee_regular', name: 'Shopee', sub: 'Regular', fee: 3, color: '#EF4444' },
  { id: 'shopee_mall', name: 'Shopee', sub: 'Mall', fee: 5, color: '#EF4444' },
  { id: 'tokopedia_pm', name: 'Tokopedia', sub: 'Power Merchant', fee: 1.8, color: '#059669' },
  { id: 'tokopedia_os', name: 'Tokopedia', sub: 'Official Store', fee: 3, color: '#059669' },
  { id: 'tiktok', name: 'TikTok Shop', sub: 'Standard', fee: 2.5, color: '#0F172A' },
  { id: 'lazada', name: 'Lazada', sub: 'Standard', fee: 2, color: '#7C3AED' },
  { id: 'custom', name: 'Kustom', sub: 'Isi sendiri', fee: 0, color: '#6366F1' },
]

export function EcommerceTab() {
  const [hpp, setHpp] = useState('')
  const [extra, setExtra] = useState('')
  const [ongkir, setOngkir] = useState('')
  const [targetMargin, setTargetMargin] = useState('30')
  const [platformId, setPlatformId] = useState('shopee_regular')
  const [customFee, setCustomFee] = useState('')
  const [manualPrice, setManualPrice] = useState('')

  const platform = PLATFORMS.find(p => p.id === platformId)!
  const fee = platformId === 'custom' ? (parseFloat(customFee) || 0) : platform.fee
  const parseHpp = (v: string) => parseFloat(v.replace(/\./g, '')) || 0

  const totalCost = parseHpp(hpp) + parseHpp(extra) + parseHpp(ongkir)
  const minPrice = fee < 100 ? totalCost / (1 - fee / 100) : 0
  const targetProfit = (parseFloat(targetMargin) || 0) / 100 * parseHpp(hpp)
  const recPrice = fee < 100 ? (totalCost + targetProfit) / (1 - fee / 100) : 0

  const manualVal = parseHpp(manualPrice)
  const manualAfterFee = manualVal * (1 - fee / 100)
  const manualProfit = manualAfterFee - totalCost
  const manualMargin = totalCost > 0 ? (manualProfit / manualVal) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PLATFORMS.map(p => (
          <button key={p.id} onClick={() => setPlatformId(p.id)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              borderColor: platformId === p.id ? p.color : '#E2E8F0',
              background: platformId === p.id ? `${p.color}10` : '#fff',
              color: platformId === p.id ? p.color : '#64748B',
            }}>{p.name} {p.sub}</button>
        ))}
      </div>
      {platformId === 'custom' && (
        <div>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Fee Platform (%)</label>
          <input value={customFee} onChange={e => setCustomFee(e.target.value)} placeholder="contoh: 3.5"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}><NumInput label="HPP per pcs (Rp)" value={hpp} onChange={setHpp} /></div>
        <div style={{ flex: 1, minWidth: 180 }}><NumInput label="Biaya Tambahan (Rp)" value={extra} onChange={setExtra} /></div>
        <div style={{ flex: 1, minWidth: 180 }}><NumInput label="Subsidi Ongkir (Rp)" value={ongkir} onChange={setOngkir} /></div>
        <div style={{ flex: 1, minWidth: 180 }}><NumInput label="Target Margin (%)" value={targetMargin} onChange={setTargetMargin} /></div>
      </div>

      <div className="three-col">
        <div className="card" style={{ border: '2px solid #FCA5A5', background: '#FFF5F5' }}>
          <p style={{ fontSize: 11, color: '#DC2626', fontWeight: 700 }}>Harga Minimum (Break Even)</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#DC2626', margin: '4px 0 0' }}>{formatRupiah(minPrice)}</p>
          <p style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Harga terendah tanpa rugi setelah potong fee {fee}%</p>
        </div>
        <div className="card" style={{ border: '2px solid #BBF7D0', background: '#F0FDF4' }}>
          <p style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>Harga Rekomendasi</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#059669', margin: '4px 0 0' }}>{formatRupiah(recPrice)}</p>
          <p style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Dengan margin {targetMargin}%</p>
        </div>
        <div className="card">
          <p style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Simulasi Manual</p>
          <NumInput value={manualPrice} onChange={setManualPrice} placeholder="Harga yg kamu mau" />
          {manualVal > 0 && (
            <>
              <p style={{ fontSize: 13, margin: '8px 0 0' }}>Setelah fee: <strong>{formatRupiah(manualAfterFee)}</strong></p>
              <p style={{ fontSize: 13, color: manualProfit >= 0 ? '#10B981' : '#EF4444' }}>
                Profit: <strong>{formatRupiah(manualProfit)}</strong> ({manualMargin.toFixed(1)}%)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

─── src/components/features/pricing/ResellerTab.tsx ───
'use client'
import { useState } from 'react'
import { formatRupiah } from '@/lib/utils'
import NumInput from '@/components/ui/NumInput'

export function ResellerTab() {
  const [hpp, setHpp] = useState('')
  const [extra, setExtra] = useState('')
  const [margin, setMargin] = useState('30')
  const [shipCost, setShipCost] = useState('')
  const [shipQty, setShipQty] = useState('')
  const [resellerMargin, setResellerMargin] = useState('20')
  const [manualPrice, setManualPrice] = useState('')

  const parseHpp = (v: string) => parseFloat(v.replace(/\./g, '')) || 0

  const totalCost = parseHpp(hpp) + parseHpp(extra)
  const shipPerPcs = parseHpp(shipQty) > 0 ? parseHpp(shipCost) / parseHpp(shipQty) : 0
  const costWithShip = totalCost + shipPerPcs
  const targetProfit = (parseFloat(margin) || 0) / 100 * costWithShip
  const resellerPrice = costWithShip + targetProfit

  const resellerMarginVal = (parseFloat(resellerMargin) || 0) / 100
  const consumerPrice = resellerPrice / (1 - resellerMarginVal)

  const manualVal = parseHpp(manualPrice)
  const manualProfit = manualVal - costWithShip
  const manualMargin = costWithShip > 0 ? (manualProfit / costWithShip) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}><NumInput label="HPP per pcs (Rp)" value={hpp} onChange={setHpp} /></div>
        <div style={{ flex: 1, minWidth: 180 }}><NumInput label="Biaya Tambahan (Rp)" value={extra} onChange={setExtra} /></div>
        <div style={{ flex: 1, minWidth: 180 }}><NumInput label="Margin Kamu (%)" value={margin} onChange={setMargin} /></div>
      </div>

      <div className="card" style={{ background: '#F8FAFC', padding: 16 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Biaya Kirim ke Reseller</h4>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><NumInput label="Total Ongkir (Rp)" value={shipCost} onChange={setShipCost} /></div>
          <div style={{ flex: 1 }}><NumInput label="Jumlah Produk Dikirim (pcs)" value={shipQty} onChange={setShipQty} /></div>
        </div>
        {shipPerPcs > 0 && <p style={{ fontSize: 13, color: '#64748B', marginTop: 8 }}>Ongkir per pcs: <strong>{formatRupiah(shipPerPcs)}</strong></p>}
      </div>

      <div className="three-col">
        <div className="card" style={{ border: '2px solid #C7D2FE', background: '#EEF2FF' }}>
          <p style={{ fontSize: 11, color: '#4338CA', fontWeight: 700 }}>Harga ke Reseller</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#4338CA', margin: '4px 0 0' }}>{formatRupiah(resellerPrice)}</p>
          <p style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Margin kamu {margin}% dari biaya + ongkir</p>
        </div>
        <div className="card" style={{ border: '2px solid #BBF7D0', background: '#F0FDF4' }}>
          <p style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>Saran Harga Jual Reseller</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#059669', margin: '4px 0 0' }}>{formatRupiah(consumerPrice)}</p>
          <p style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Reseller bisa jual dengan margin {resellerMargin}%</p>
        </div>
        <div className="card">
          <p style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Simulasi Manual</p>
          <NumInput value={manualPrice} onChange={setManualPrice} placeholder="Harga yg kamu mau" />
          {manualVal > 0 && (
            <>
              <p style={{ fontSize: 13, margin: '8px 0 0' }}>Profit/unit: <strong style={{ color: manualProfit >= 0 ? '#10B981' : '#EF4444' }}>{formatRupiah(manualProfit)}</strong></p>
              <p style={{ fontSize: 13, color: '#64748B' }}>Margin: {manualMargin.toFixed(1)}%</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
STEP 6: src/store/index.ts (Zustand)
'use client'
import { create } from 'zustand'
interface AppStore {
  dashboardVersion: number
  triggerDashboardRefresh: () => void
}
export const useAppStore = create<AppStore>((set) => ({
  dashboardVersion: 0,
  triggerDashboardRefresh: () => set(s => ({ dashboardVersion: s.dashboardVersion + 1 })),
}))
Pakainya: setiap kali ada aksi di halaman lain yang ngefek ke dashboard (misal: jual di products page), panggil useAppStore.getState().triggerDashboardRefresh(). Dashboard bakal refetch otomatis.
STEP 7: Rewrite Pages
app/page.tsx (Dashboard — dari 664 → ~80 lines)
'use client'
import { useEffect } from 'react'
import { useDashboard } from '@/lib/hooks'
import { useAppStore } from '@/store'
import { StatsCards } from '@/components/features/dashboard/StatsCards'
import { ProfitTracker } from '@/components/features/dashboard/ProfitTracker'
import { DashboardCharts } from '@/components/features/dashboard/DashboardCharts'
import { useSettings } from '@/lib/hooks'
import PageHeader from '@/components/ui/PageHeader'
import { LayoutDashboard } from 'lucide-react'
export default function DashboardPage() {
  const dashboard = useDashboard()
  const { settings, balance, setSetting, setInitialBalance } = useSettings()
  const dashboardVersion = useAppStore(s => s.dashboardVersion)
  useEffect(() => {
    dashboard.refetch()
  }, [dashboardVersion])
  return (
    <>
      <PageHeader icon={LayoutDashboard} title="Dashboard" />
      {dashboard.loading ? <Loading /> : (
        <>
          <StatsCards metrics={dashboard.metrics} />
          <ProfitTracker
            metrics={dashboard.metrics}
            settings={settings}
            onSetModal={setSetting}
            onSetBalance={setInitialBalance}
          />
          <DashboardCharts
            productSales={dashboard.productSales}
            cashflowTrend={dashboard.cashflowTrend}
          />
          {/* Critical stock alerts */}
          {dashboard.criticalMaterials.map(m => (
            <Alert key={m.id} material={m} />
          ))}
        </>
      )}
    </>
  )
}
app/products/page.tsx (dari 658 → ~50 lines)
'use client'
import { useProducts, useResellers } from '@/lib/hooks'
import { salesDb, distributionsDb } from '@/lib/db'
import { ProductList } from '@/components/features/products/ProductList'
import PageHeader from '@/components/ui/PageHeader'
import { Package } from 'lucide-react'
import { useAppStore } from '@/store'
export default function ProductsPage() {
  const products = useProducts()
  const resellers = useResellers()
  const triggerRefresh = useAppStore(s => s.triggerDashboardRefresh)
  const handleSale = async (params: any) => {
    await salesDb.recordSale(params)
    triggerRefresh()
  }
  const handleDistribute = async (params: any) => {
    await distributionsDb.distribute(params)
    triggerRefresh()
  }
  const handleResellerPayment = async (params: any) => {
    await resellers.recordPayment(params)
    triggerRefresh()
  }
  return (
    <>
      <PageHeader icon={Package} title="Produk & Varian" />
      <ProductList
        products={products.data}
        resellers={resellers.data}
        loading={products.loading}
        saving={products.saving}
        onCreateProduct={products.createProduct}
        onUpdateProduct={products.updateProduct}
        onDeleteProduct={products.removeProduct}
        onCreateVariant={products.createVariant}
        onUpdateVariant={products.updateVariant}
        onDeleteVariant={products.removeVariant}
        onSale={handleSale}
        onDistribute={handleDistribute}
        onResellerPayment={handleResellerPayment}
        onCreateReseller={resellers.createOrGet}
      />
    </>
  )
}
app/inventory/page.tsx (dari 526 → ~60 lines)
app/cashflow/page.tsx (dari 656 → ~50 lines)
app/rad/page.tsx (dari 343 → ~40 lines)
app/pricing/page.tsx (dari 465 → ~30 lines — paling mudah, pure calculator)
Pattern-nya sama: import hook → masukin data & actions ke feature component via props.
STEP 8: Cleanup
Hapus file-file ini:
supabase/schema.sql
supabase/migration_auth.sql
supabase/migration_metrics.sql
supabase/migration_rad_v2.sql
supabase/migration_reseller.sql
supabase/migration_settings.sql
Jalankan:
npm run lint
npm run dev
EXECUTION ORDER
1.  supabase/init.sql              → Run di Supabase SQL Editor
2.  src/types/index.ts             → Timpa file
3.  src/lib/db/ (13 files)         → Bikin folder + semua file
4.  src/lib/hooks/ (9 files)       → Bikin folder + semua file  
5.  src/store/index.ts             → Timpa file
6.  src/components/features/       → Bikin folder + extract components dari halaman lama
7.  src/app/*/page.tsx (7 files)   → Rewrite jadi tipis
8.  Hapus file migrate lama        → Cleanup
9.  npm run dev                    → Test