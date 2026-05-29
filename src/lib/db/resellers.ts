import { supabase, getUserId } from '@/lib/supabase'
import type { Reseller } from '@/types'

export const resellersDb = {
  async getAll(): Promise<Reseller[]> {
    const { data, error } = await supabase.from('resellers').select('*').order('name')
    if (error) throw error
    return data
  },

  async createOrGet(name: string): Promise<Reseller> {
    const { data: existing } = await supabase
      .from('resellers')
      .select('*')
      .ilike('name', name)
      .maybeSingle()
    if (existing) return existing
    const { data, error } = await supabase.from('resellers').insert({ name }).select().single()
    if (error) throw error
    return data
  },

  async remove(id: string) {
    const { error } = await supabase.from('resellers').delete().eq('id', id)
    if (error) throw error
  },

  async recordPayment(params: {
    distributionId: string
    quantity: number
    amount: number
    recordCashflow?: boolean
  }) {
    const { error } = await supabase.rpc('fn_reseller_payment', {
      p_user_id: await getUserId(),
      p_distribution_id: params.distributionId,
      p_quantity: params.quantity,
      p_amount: params.amount,
      p_record_cashflow: params.recordCashflow ?? false,
    })
    if (error) throw error
  },
}
