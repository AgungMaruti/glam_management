import { supabase } from '@/lib/supabase'
import type { Recipe, RawMaterial, Variant } from '@/types'

export const recipesDb = {
  async getAllByVariant(): Promise<(Variant & { recipes: (Recipe & { raw_material: RawMaterial })[] })[]> {
    const { data, error } = await supabase
      .from('variants')
      .select('*, recipes(*, raw_material:raw_materials(*)), product:products(name)')
      .order('created_at')
    if (error) throw error
    return data
  },

  async create(params: { variant_id: string; raw_material_id: string; quantity_needed: number }) {
    const { data, error } = await supabase.from('recipes').insert(params).select().single()
    if (error) throw error
    return data
  },

  async remove(id: string) {
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) throw error
  },
}
