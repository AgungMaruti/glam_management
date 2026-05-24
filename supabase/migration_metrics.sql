-- Migration: Add metrics table with auto-recalculation triggers
-- Run this in Supabase SQL Editor

-- 1. Create metrics table
CREATE TABLE IF NOT EXISTS metrics (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default metric keys
INSERT INTO metrics (key) VALUES 
  ('kas_all_time'),
  ('total_income_all_time'),
  ('total_expense_all_time'),
  ('kas_bulan_ini'),
  ('total_income_bulan_ini'),
  ('total_expense_bulan_ini'),
  ('modal_bisnis'),
  ('profit_bersih'),
  ('roi'),
  ('hpp_modal_muter'),
  ('untung_murni'),
  ('hpp_per_unit'),
  ('selling_price'),
  ('total_sold'),
  ('total_sold_bulan_ini'),
  ('total_piutang'),
  ('bep_botol'),
  ('critical_stock_count'),
  ('gaji_bulan_ini'),
  ('marketing_bulan_ini'),
  ('operasional_bulan_ini')
ON CONFLICT (key) DO NOTHING;

-- 2. Create recalculate function
CREATE OR REPLACE FUNCTION recalculate_metrics()
RETURNS void AS $$
DECLARE
  v_kas_all NUMERIC := 0;
  v_income_all NUMERIC := 0;
  v_expense_all NUMERIC := 0;
  v_kas_bulan NUMERIC := 0;
  v_income_bulan NUMERIC := 0;
  v_expense_bulan NUMERIC := 0;
  v_modal NUMERIC := 0;
  v_hpp NUMERIC := 0;
  v_price NUMERIC := 0;
  v_sold NUMERIC := 0;
  v_sold_bulan NUMERIC := 0;
  v_piutang NUMERIC := 0;
  v_gaji NUMERIC := 0;
  v_marketing NUMERIC := 0;
  v_ops NUMERIC := 0;
  v_bulan_from TEXT;
  v_margin NUMERIC := 0;
  v_bep NUMERIC := 0;
  v_crit INT := 0;
BEGIN
  -- All time
  SELECT COALESCE(SUM(amount), 0) INTO v_income_all FROM cashflow WHERE type = 'income';
  SELECT COALESCE(SUM(amount), 0) INTO v_expense_all FROM cashflow WHERE type = 'expense';
  v_kas_all := v_income_all - v_expense_all;

  -- Bulan ini
  v_bulan_from := date_trunc('month', now())::text;
  SELECT COALESCE(SUM(amount), 0) INTO v_income_bulan FROM cashflow WHERE type = 'income' AND transaction_date >= v_bulan_from;
  SELECT COALESCE(SUM(amount), 0) INTO v_expense_bulan FROM cashflow WHERE type = 'expense' AND transaction_date >= v_bulan_from;
  v_kas_bulan := v_income_bulan - v_expense_bulan;

  -- Gaji, marketing, operasional bulan ini
  SELECT COALESCE(SUM(amount), 0) INTO v_gaji FROM cashflow WHERE category = 'Gaji Karyawan' AND transaction_date >= v_bulan_from;
  SELECT COALESCE(SUM(amount), 0) INTO v_marketing FROM cashflow WHERE category = 'Marketing' AND transaction_date >= v_bulan_from;
  SELECT COALESCE(SUM(amount), 0) INTO v_ops FROM cashflow WHERE category = 'Operasional' AND transaction_date >= v_bulan_from;

  -- Settings
  SELECT COALESCE(NULLIF(value, '')::numeric, 0) INTO v_modal FROM settings WHERE key = 'modal_bisnis';
  SELECT COALESCE(NULLIF(value, '')::numeric, 0) INTO v_hpp FROM settings WHERE key = 'hpp_per_unit';
  SELECT COALESCE(NULLIF(value, '')::numeric, 0) INTO v_price FROM settings WHERE key = 'selling_price';

  -- Total sold
  SELECT COALESCE(SUM(quantity), 0) INTO v_sold FROM sales;
  SELECT COALESCE(SUM(quantity), 0) INTO v_sold_bulan FROM sales WHERE sold_at >= v_bulan_from;

  -- Piutang
  SELECT COALESCE(SUM(d.quantity * d.price_per_unit), 0) - COALESCE(SUM(p.amount), 0) INTO v_piutang
  FROM distributions d
  LEFT JOIN reseller_payments p ON d.reseller_id = p.reseller_id;

  -- Critical stock
  SELECT COUNT(*) INTO v_crit FROM raw_materials WHERE stock <= min_stock;

  -- BEP
  v_margin := v_price - v_hpp;
  IF v_margin > 0 THEN
    v_bep := CEIL((v_gaji + v_marketing + v_ops) / v_margin);
  ELSE
    v_bep := 0;
  END IF;

  -- Update all metrics
  UPDATE metrics SET value = v_kas_all, updated_at = now() WHERE key = 'kas_all_time';
  UPDATE metrics SET value = v_income_all, updated_at = now() WHERE key = 'total_income_all_time';
  UPDATE metrics SET value = v_expense_all, updated_at = now() WHERE key = 'total_expense_all_time';
  UPDATE metrics SET value = v_kas_bulan, updated_at = now() WHERE key = 'kas_bulan_ini';
  UPDATE metrics SET value = v_income_bulan, updated_at = now() WHERE key = 'total_income_bulan_ini';
  UPDATE metrics SET value = v_expense_bulan, updated_at = now() WHERE key = 'total_expense_bulan_ini';
  UPDATE metrics SET value = v_modal, updated_at = now() WHERE key = 'modal_bisnis';
  UPDATE metrics SET value = v_kas_all - v_modal, updated_at = now() WHERE key = 'profit_bersih';
  UPDATE metrics SET value = CASE WHEN v_modal > 0 THEN ((v_kas_all - v_modal) / v_modal * 100) ELSE 0 END, updated_at = now() WHERE key = 'roi';
  UPDATE metrics SET value = CASE WHEN v_modal > 0 AND v_price > 0 THEN (v_kas_all - v_modal) * (v_hpp / v_price) ELSE 0 END, updated_at = now() WHERE key = 'hpp_modal_muter';
  UPDATE metrics SET value = CASE WHEN v_modal > 0 AND v_price > 0 THEN (v_kas_all - v_modal) * ((v_price - v_hpp) / v_price) ELSE 0 END, updated_at = now() WHERE key = 'untung_murni';
  UPDATE metrics SET value = v_hpp, updated_at = now() WHERE key = 'hpp_per_unit';
  UPDATE metrics SET value = v_price, updated_at = now() WHERE key = 'selling_price';
  UPDATE metrics SET value = v_sold, updated_at = now() WHERE key = 'total_sold';
  UPDATE metrics SET value = v_sold_bulan, updated_at = now() WHERE key = 'total_sold_bulan_ini';
  UPDATE metrics SET value = v_piutang, updated_at = now() WHERE key = 'total_piutang';
  UPDATE metrics SET value = v_bep, updated_at = now() WHERE key = 'bep_botol';
  UPDATE metrics SET value = v_crit, updated_at = now() WHERE key = 'critical_stock_count';
  UPDATE metrics SET value = v_gaji, updated_at = now() WHERE key = 'gaji_bulan_ini';
  UPDATE metrics SET value = v_marketing, updated_at = now() WHERE key = 'marketing_bulan_ini';
  UPDATE metrics SET value = v_ops, updated_at = now() WHERE key = 'operasional_bulan_ini';
END;
$$ LANGUAGE plpgsql;

-- 3. Create triggers
CREATE OR REPLACE FUNCTION trigger_recalculate()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM recalculate_metrics();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if any
DROP TRIGGER IF EXISTS trg_cashflow_change ON cashflow;
DROP TRIGGER IF EXISTS trg_sales_change ON sales;
DROP TRIGGER IF EXISTS trg_settings_change ON settings;
DROP TRIGGER IF EXISTS trg_distributions_change ON distributions;
DROP TRIGGER IF EXISTS trg_payments_change ON reseller_payments;
DROP TRIGGER IF EXISTS trg_materials_change ON raw_materials;

-- Create triggers
CREATE TRIGGER trg_cashflow_change
  AFTER INSERT OR UPDATE OR DELETE ON cashflow
  FOR EACH STATEMENT EXECUTE FUNCTION trigger_recalculate();

CREATE TRIGGER trg_sales_change
  AFTER INSERT OR UPDATE OR DELETE ON sales
  FOR EACH STATEMENT EXECUTE FUNCTION trigger_recalculate();

CREATE TRIGGER trg_settings_change
  AFTER INSERT OR UPDATE OR DELETE ON settings
  FOR EACH STATEMENT EXECUTE FUNCTION trigger_recalculate();

CREATE TRIGGER trg_distributions_change
  AFTER INSERT OR UPDATE OR DELETE ON distributions
  FOR EACH STATEMENT EXECUTE FUNCTION trigger_recalculate();

CREATE TRIGGER trg_payments_change
  AFTER INSERT OR UPDATE OR DELETE ON reseller_payments
  FOR EACH STATEMENT EXECUTE FUNCTION trigger_recalculate();

CREATE TRIGGER trg_materials_change
  AFTER INSERT OR UPDATE OR DELETE ON raw_materials
  FOR EACH STATEMENT EXECUTE FUNCTION trigger_recalculate();

-- 4. Run initial calculation
SELECT recalculate_metrics();
