import { supabase } from '@/lib/supabase'
import type { RawMaterial } from '@/types'

export const materialsDb = {
  async getAll(): Promise<RawMaterial[]> {
    const { data, error } = await supabase.from('raw_materials').select('*').order('name')
    if (error) throw error
    return data
  },

  async create(params: { name: string; unit: string; stock: number; min_stock: number }) {
    const { data, error } = await supabase.from('raw_materials').insert(params).select().single()
    if (error) throw error
    return data
  },

  async update(id: string, params: Partial<Pick<RawMaterial, 'name' | 'unit' | 'stock' | 'min_stock'>>) {
    const { data, error } = await supabase.from('raw_materials').update({ ...params, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async remove(id: string) {
    const { error } = await supabase.from('raw_materials').delete().eq('id', id)
    if (error) throw error
  },

  async restock(params: {
    materialId: string
    qty: number
    totalCost: number
    recordCashflow?: boolean
  }) {
    const { error } = await supabase.rpc('fn_restock_material', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_material_id: params.materialId,
      p_qty: params.qty,
      p_total_cost: params.totalCost,
      p_record_cashflow: params.recordCashflow ?? false,
    })
    if (error) throw error
  },
}
