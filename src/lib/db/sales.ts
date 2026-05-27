import { supabase } from '@/lib/supabase'

export const salesDb = {
  async recordSale(params: {
    variantId: string
    quantity: number
    unitPrice: number
    recordCashflow?: boolean
  }) {
    const { error } = await supabase.rpc('fn_record_sale', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_variant_id: params.variantId,
      p_quantity: params.quantity,
      p_unit_price: params.unitPrice,
      p_record_cashflow: params.recordCashflow ?? false,
    })
    if (error) throw error
  },
}
