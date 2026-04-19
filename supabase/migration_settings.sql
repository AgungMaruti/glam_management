-- Settings table for dashboard manual overrides
create table if not exists settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

alter table settings enable row level security;
create policy "allow all" on settings for all using (true) with check (true);

-- Default values
insert into settings (key, value) values
  ('selling_price', '75000'),
  ('hpp_per_unit', '36000')
on conflict (key) do nothing;
