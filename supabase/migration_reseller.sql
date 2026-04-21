-- Resellers
create table if not exists resellers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- Distributions (pencatatan setiap Dist ke reseller)
create table if not exists distributions (
  id uuid default gen_random_uuid() primary key,
  variant_id uuid references variants(id) on delete cascade,
  reseller_id uuid references resellers(id) on delete set null,
  quantity integer not null,
  price_per_unit numeric not null default 0,
  distributed_at timestamptz default now()
);

-- Reseller Payments (pembayaran dari reseller)
create table if not exists reseller_payments (
  id uuid default gen_random_uuid() primary key,
  reseller_id uuid references resellers(id) on delete cascade,
  variant_id uuid references variants(id) on delete cascade,
  quantity integer not null,
  amount numeric not null,
  paid_at timestamptz default now()
);

-- RLS
alter table resellers enable row level security;
alter table distributions enable row level security;
alter table reseller_payments enable row level security;

create policy "allow all" on resellers for all using (true) with check (true);
create policy "allow all" on distributions for all using (true) with check (true);
create policy "allow all" on reseller_payments for all using (true) with check (true);
