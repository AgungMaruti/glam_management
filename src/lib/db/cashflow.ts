import { supabase, getUserId } from '@/lib/supabase'
import type { Cashflow } from '@/types'

export const cashflowDb = {
  async getAll(params: {
    period?: 'daily' | 'weekly' | 'monthly' | 'all'
    page?: number
    limit?: number
  } = {}): Promise<{ data: Cashflow[]; count: number }> {
    let query = supabase.from('cashflow').select('*', { count: 'exact' })

    const now = new Date()
    if (params.period === 'daily') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      query = query.gte('transaction_date', start)
    } else if (params.period === 'weekly') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('transaction_date', start)
    } else if (params.period === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      query = query.gte('transaction_date', start)
    }

    const from = ((params.page || 1) - 1) * (params.limit || 20)
    const to = from + (params.limit || 20) - 1

    const { data, count, error } = await query.order('transaction_date', { ascending: false }).range(from, to)
    if (error) throw error
    return { data, count: count || 0 }
  },

  async addTransaction(params: {
    type: 'income' | 'expense'
    category: string
    amount: number
    description?: string
    date?: string
  }) {
    const { error } = await supabase.rpc('fn_add_cashflow', {
      p_user_id: await getUserId(),
      p_type: params.type,
      p_category: params.category,
      p_amount: params.amount,
      p_description: params.description || null,
      p_date: params.date || new Date().toISOString(),
    })
    if (error) throw error
  },

  async remove(id: string) {
    const { error } = await supabase.from('cashflow').delete().eq('id', id)
    if (error) throw error
  },
}
