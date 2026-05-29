import { supabase } from '@/lib/supabase'
import type { DashboardMetrics, SalesHppInsight, PiutangReseller, ProductSalesData, CashflowMonthlyData, RawMaterial } from '@/types'

export const dashboardDb = {
  async getMetrics(): Promise<DashboardMetrics | null> {
    const { data, error } = await supabase.rpc('get_dashboard_metrics')
    if (error || !data) return null
    return data as DashboardMetrics
  },

  async getPiutang(): Promise<PiutangReseller[]> {
    const { data, error } = await supabase
      .from('v_piutang_reseller')
      .select('*')
      .returns<PiutangReseller[]>()
    if (error) return []
    return data || []
  },

  async getProductSales(): Promise<ProductSalesData[]> {
    const { data, error } = await supabase.rpc('get_product_sales')
    if (error) return []
    return (data || []) as ProductSalesData[]
  },

  async getCashflowTrend(): Promise<CashflowMonthlyData[]> {
    const { data, error } = await supabase.rpc('get_cashflow_trend')
    if (error) return []
    return (data || []) as CashflowMonthlyData[]
  },

  async getCriticalMaterials(): Promise<RawMaterial[]> {
    const { data, error } = await supabase
      .from('raw_materials')
      .select('*')
    if (error) return []
    return (data || []).filter(m => m.stock <= m.min_stock)
  },

  async getSalesHppInsight(days = 30): Promise<SalesHppInsight | null> {
    const { data, error } = await supabase.rpc('get_sales_hpp_insight', { p_days: days })
    if (error || !data) return null
    return data as SalesHppInsight
  },
}
