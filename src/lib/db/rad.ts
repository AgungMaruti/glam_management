import { supabase } from '@/lib/supabase'
import type { Rad, RadItem } from '@/types'

export const radDb = {
  async getAll(): Promise<(Rad & { items: RadItem[] })[]> {
    const { data, error } = await supabase
      .from('rad')
      .select('*, items:rad_items(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(params: {
    title: string
    batch_quantity: number
    selling_price: number
    salary_cost: number
    other_cost: number
    items: { name: string; total_qty: number; unit: string; total_cost: number; usage_per_bottle: number }[]
  }) {
    const { data: radData, error: radErr } = await supabase
      .from('rad')
      .insert({
        title: params.title,
        batch_quantity: params.batch_quantity,
        selling_price: params.selling_price,
        salary_cost: params.salary_cost,
        other_cost: params.other_cost,
      })
      .select()
      .single()
    if (radErr) throw radErr

    const items = params.items.map(item => ({ ...item, rad_id: radData.id }))
    const { error: itemsErr } = await supabase.from('rad_items').insert(items)
    if (itemsErr) throw itemsErr

    return radData
  },

  async remove(id: string) {
    const { error } = await supabase.from('rad').delete().eq('id', id)
    if (error) throw error
  },
}
