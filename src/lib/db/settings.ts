import { supabase } from '@/lib/supabase'

export const settingsDb = {
  async get(key: string): Promise<string | null> {
    const { data, error } = await supabase.from('settings').select('value').eq('key', key).single()
    if (error) return null
    return data?.value || null
  },

  async set(key: string, value: string) {
    const { error } = await supabase.from('settings').upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,key' }
    )
    if (error) throw error
  },

  async getAll(): Promise<Record<string, string>> {
    const { data, error } = await supabase.from('settings').select('key, value')
    if (error) throw error
    return Object.fromEntries((data || []).map((s: { key: string; value: string }) => [s.key, s.value]))
  },
}
