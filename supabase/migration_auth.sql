-- Migration: Enable Authentication & Secure RLS
-- Run this in Supabase SQL Editor after enabling Email provider in Auth settings

-- 1. Drop old "allow all" policies (if they exist)
drop policy if exists "allow all" on raw_materials;
drop policy if exists "allow all" on products;
drop policy if exists "allow all" on variants;
drop policy if exists "allow all" on recipes;
drop policy if exists "allow all" on productions;
drop policy if exists "allow all" on sales;
drop policy if exists "allow all" on resellers;
drop policy if exists "allow all" on distributions;
drop policy if exists "allow all" on reseller_payments;
drop policy if exists "allow all" on cashflow;
drop policy if exists "allow all" on settings;
drop policy if exists "allow all" on rad;
drop policy if exists "allow all" on rad_items;

-- 2. Create new authenticated-only policies
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
