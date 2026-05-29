import { supabase, getUserId } from '@/lib/supabase'

export const distributionsDb = {
  async distribute(params: {
    variantId: string
    resellerId: string
    quantity: number
    pricePerUnit: number
  }): Promise<string> {
    const { data, error } = await supabase.rpc('fn_distribute_to_reseller', {
      p_user_id: await getUserId(),
      p_variant_id: params.variantId,
      p_reseller_id: params.resellerId,
      p_quantity: params.quantity,
      p_price_per_unit: params.pricePerUnit,
    })
    if (error) throw error
    return data
  },

  async getByReseller(resellerId: string) {
    const { data, error } = await supabase
      .from('distributions')
      .select('*, variant:variants(name, product:products(name)), reseller:resellers(name)')
      .eq('reseller_id', resellerId)
      .order('distributed_at', { ascending: false })
    if (error) throw error
    return data
  },
}
