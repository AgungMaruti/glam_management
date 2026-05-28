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
  hpp_bahan      numeric not null default 0,
  hpp_full_cost  numeric not null default 0,
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

  update variants
  set stock_own = stock_own + p_quantity, updated_at = now()
  where id = p_variant_id and user_id = p_user_id;

  insert into productions (variant_id, user_id, quantity, total_cost, notes)
  values (p_variant_id, p_user_id, p_quantity, v_total_cost, p_notes);

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

-- ─── 9. RPC FUNCTIONS FOR DASHBOARD ───────────────────────

create or replace function get_dashboard_metrics()
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'total_income_all', coalesce((select sum(amount) from cashflow where user_id = auth.uid() and type = 'income'), 0),
    'total_expense_all', coalesce((select sum(amount) from cashflow where user_id = auth.uid() and type = 'expense'), 0),
    'saldo', coalesce((select sum(case when type='income' then amount else -amount end) from cashflow where user_id = auth.uid()), 0),
    'total_income_bulan', coalesce((select sum(amount) from cashflow where user_id = auth.uid() and type = 'income' and transaction_date >= date_trunc('month', now())), 0),
    'total_expense_bulan', coalesce((select sum(amount) from cashflow where user_id = auth.uid() and type = 'expense' and transaction_date >= date_trunc('month', now())), 0),
    'saldo_bulan', coalesce((select sum(case when type='income' then amount else -amount end) from cashflow where user_id = auth.uid() and transaction_date >= date_trunc('month', now())), 0),
    'modal_bisnis', coalesce((select nullif(value, '')::numeric from settings where user_id = auth.uid() and key = 'modal_bisnis'), 0),
    'profit_bersih', coalesce((select sum(case when type='income' then amount else -amount end) from cashflow where user_id = auth.uid()), 0) - coalesce((select nullif(value, '')::numeric from settings where user_id = auth.uid() and key = 'modal_bisnis'), 0),
    'roi', case when coalesce((select nullif(value, '')::numeric from settings where user_id = auth.uid() and key = 'modal_bisnis'), 0) > 0 then (coalesce((select sum(case when type='income' then amount else -amount end) from cashflow where user_id = auth.uid()), 0) - coalesce((select nullif(value, '')::numeric from settings where user_id = auth.uid() and key = 'modal_bisnis'), 0)) / coalesce((select nullif(value, '')::numeric from settings where user_id = auth.uid() and key = 'modal_bisnis'), 0) * 100 else 0 end,
    'total_sold', coalesce((select sum(quantity) from sales where user_id = auth.uid()), 0),
    'total_sold_bulan', coalesce((select sum(quantity) from sales where user_id = auth.uid() and sold_at >= date_trunc('month', now())), 0),
    'total_piutang', coalesce((select sum(d.quantity * d.price_per_unit) from distributions d where d.user_id = auth.uid()), 0) - coalesce((select sum(rp.amount) from reseller_payments rp where rp.user_id = auth.uid()), 0),
    'critical_stock_count', (select count(*)::int from raw_materials where user_id = auth.uid() and stock <= min_stock),
    'gaji_bulan', coalesce((select sum(amount) from cashflow where user_id = auth.uid() and category = 'Gaji Karyawan' and transaction_date >= date_trunc('month', now())), 0),
    'marketing_bulan', coalesce((select sum(amount) from cashflow where user_id = auth.uid() and category = 'Marketing' and transaction_date >= date_trunc('month', now())), 0),
    'operasional_bulan', coalesce((select sum(amount) from cashflow where user_id = auth.uid() and category = 'Operasional' and transaction_date >= date_trunc('month', now())), 0),
    'bep_botol', 0,
    'hpp_per_unit', coalesce((select nullif(value, '')::numeric from settings where user_id = auth.uid() and key = 'hpp_per_unit'), 0),
    'selling_price', coalesce((select nullif(value, '')::numeric from settings where user_id = auth.uid() and key = 'selling_price'), 0)
  ) into result;
  return result;
end;
$$ language plpgsql security definer;

create or replace function get_product_sales()
returns table(variant_id uuid, variant_name text, product_name text, total_qty bigint, total_revenue numeric) as $$
begin
  return query
  select
    v.id as variant_id,
    v.name as variant_name,
    p.name as product_name,
    coalesce(sum(s.quantity), 0) as total_qty,
    coalesce(sum(s.total_amount), 0) as total_revenue
  from variants v
  join products p on p.id = v.product_id
  left join sales s on s.variant_id = v.id
  where v.user_id = auth.uid()
  group by v.id, v.name, p.name
  order by total_revenue desc;
end;
$$ language plpgsql security definer;

create or replace function get_cashflow_trend()
returns table(month text, total_income numeric, total_expense numeric, net numeric) as $$
begin
  return query
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
end;
$$ language plpgsql security definer;
