// ═══════════════════════════════════════════════════════════
// GLAM MANAGEMENT V2 — Type Definitions
// ═══════════════════════════════════════════════════════════

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

export interface Rad {
  id: string
  user_id: string
  title: string
  batch_quantity: number
  selling_price: number
  salary_cost: number
  other_cost: number
  hpp_bahan: number
  hpp_full_cost: number
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

export interface SalesHppInsight {
  total_penjualan: number
  unit_terjual: number
  avg_hpp_bahan: number
  avg_hpp_full: number
  hpp_bahan_total: number
  hpp_full_total: number
  profit_bahan: number
  profit_full: number
  margin_bahan_pct: number
  margin_full_pct: number
  uang_diputar: number
  rad_count: number
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
