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

  async update(id: string, params: Partial<Pick<Variant, 'name' | 'size_ml' | 'selling_price' | 'stock_own'>>) {
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
    const prodMap: Record<string, number> = {}
    const salesMap: Record<string, number> = {}
    ;(prodRes.data || []).forEach((p: { variant_id: string; quantity: number }) => { prodMap[p.variant_id] = (prodMap[p.variant_id] || 0) + p.quantity })
    ;(salesRes.data || []).forEach((s: { variant_id: string; quantity: number }) => { salesMap[s.variant_id] = (salesMap[s.variant_id] || 0) + s.quantity })
    const allIds = [...new Set([...Object.keys(prodMap), ...Object.keys(salesMap)])]
    return allIds.map(id => ({
      variant_id: id,
      total_produced: prodMap[id] || 0,
      total_sold: salesMap[id] || 0,
    }))
  },
}
