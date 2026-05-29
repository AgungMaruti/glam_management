import { supabase, getUserId } from '@/lib/supabase'
import type { Production, Variant } from '@/types'

export const productionsDb = {
  async getAll(page = 1, limit = 15): Promise<{ data: (Production & { variant: Variant })[]; count: number }> {
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, count, error } = await supabase
      .from('productions')
      .select('*, variant:variants(*, product:products(name))', { count: 'exact' })
      .order('produced_at', { ascending: false })
      .range(from, to)
    if (error) throw error
    return { data, count: count || 0 }
  },

  async run(params: {
    variantId: string
    quantity: number
    notes?: string
  }) {
    const { error } = await supabase.rpc('fn_run_production', {
      p_user_id: await getUserId(),
      p_variant_id: params.variantId,
      p_quantity: params.quantity,
      p_notes: params.notes || null,
    })
    if (error) throw error
  },
}
