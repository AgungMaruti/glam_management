import { supabase } from '@/lib/supabase'
import type { InitialBalance } from '@/types'

export const balanceDb = {
  async get(): Promise<InitialBalance | null> {
    const { data, error } = await supabase.from('initial_balance').select('*').single()
    if (error) return null
    return data
  },

  async set(amount: number) {
    const { error } = await supabase.from('initial_balance').upsert(
      { amount, set_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    if (error) throw error
  },
}
