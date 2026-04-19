-- RAD v2: Flexible line items + proportional cost calculation

-- Drop old rad table and recreate
drop table if exists rad cascade;

create table rad (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  batch_quantity integer not null default 1,
  selling_price numeric not null default 0,
  salary_cost numeric not null default 0,
  other_cost numeric not null default 0,
  created_at timestamptz default now()
);

-- Flexible RAD line items
create table rad_items (
  id uuid default gen_random_uuid() primary key,
  rad_id uuid references rad(id) on delete cascade,
  name text not null,
  total_qty numeric not null default 1,
  unit text not null default 'pcs',
  total_cost numeric not null default 0,
  usage_per_bottle numeric not null default 1,
  created_at timestamptz default now()
);

-- RLS
alter table rad enable row level security;
alter table rad_items enable row level security;
create policy "allow all" on rad for all using (true) with check (true);
create policy "allow all" on rad_items for all using (true) with check (true);
