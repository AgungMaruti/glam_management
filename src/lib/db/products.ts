import { supabase } from '@/lib/supabase'
import type { Product, Variant } from '@/types'

export const productsDb = {
  async getAll(): Promise<(Product & { variants: Variant[] })[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, variants(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async create(name: string, description?: string) {
    const { data, error } = await supabase
      .from('products')
      .insert({ name, description })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, params: { name: string; description?: string }) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...params, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  },
}
