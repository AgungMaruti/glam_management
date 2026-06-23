import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyBotToken } from '@/lib/botAuth'

// Prevent static generation — this route always runs at request time
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!verifyBotToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Lazy — only created at request time, not during build
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { data: cashflow } = await supabase.from('cashflow').select('*').order('transaction_date', { ascending: false })
    const { data: variants } = await supabase.from('variants').select('*')
    const { data: sales } = await supabase.from('sales').select('*, variants(name, selling_price, hpp_per_unit)').order('sold_at', { ascending: false })
    const { data: settings } = await supabase.from('settings').select('*')
    const { data: rawMaterials } = await supabase.from('raw_materials').select('*')
    const { data: recipes } = await supabase.from('recipes').select('*')
    const { data: rad } = await supabase.from('rad').select('*').order('created_at', { ascending: false })
    const { data: resellers } = await supabase.from('resellers').select('*')

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        cashflow: cashflow || [],
        variants: variants || [],
        sales: sales || [],
        settings: settings || [],
        rawMaterials: rawMaterials || [],
        recipes: recipes || [],
        rad: rad || [],
        resellers: resellers || [],
      }
    })
  } catch (error) {
    console.error('[Bot API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
