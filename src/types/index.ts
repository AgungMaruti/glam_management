export interface RawMaterial {
  id: string
  name: string
  unit: string
  stock: number
  min_stock: number
  cost_per_unit: number
  created_at: string
}

export interface Product {
  id: string
  name: string
  description?: string
  image_url?: string
  created_at: string
  variants?: Variant[]
}

export interface Variant {
  id: string
  product_id: string
  name: string
  size_ml: number
  selling_price: number
  stock: number
  stock_reseller: number
  created_at: string
  product?: Product
  recipes?: Recipe[]
  total_produced?: number
  total_sold?: number
}

export interface Recipe {
  id: string
  variant_id: string
  raw_material_id: string
  quantity_needed: number
  created_at: string
  raw_material?: RawMaterial
}

export interface Production {
  id: string
  variant_id: string
  quantity: number
  produced_at: string
  notes?: string
  variant?: Variant
}

export interface Sale {
  id: string
  variant_id: string
  quantity: number
  unit_price: number
  total_amount: number
  sold_at: string
  notes?: string
  variant?: Variant
}

export interface RAD {
  id: string
  title: string
  batch_quantity: number
  bibit_cost: number
  absolut_cost: number
  bottle_cost: number
  sticker_cost: number
  box_cost: number
  other_cost: number
  hpp_per_unit: number
  margin_30: number
  margin_50: number
  margin_100: number
  created_at: string
}

export interface Cashflow {
  id: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description?: string
  transaction_date: string
  created_at: string
}

export interface Reseller {
  id: string
  name: string
  created_at: string
}

export interface Distribution {
  id: string
  variant_id: string
  reseller_id: string | null
  quantity: number
  price_per_unit: number
  distributed_at: string
  reseller?: Reseller
  variant?: Variant
}

export interface ResellerPayment {
  id: string
  reseller_id: string
  variant_id: string
  quantity: number
  amount: number
  paid_at: string
  reseller?: Reseller
  variant?: Variant
}

export interface ResellerSummary {
  reseller: Reseller
  totalTagihan: number
  totalDibayar: number
  sisaPiutang: number
}
