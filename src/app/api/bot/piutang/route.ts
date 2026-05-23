import { NextResponse } from 'next/server'
import { getClient } from '@/lib/supabase'

export async function GET() {
  const supabase = getClient()

  try {
    const [distResult, payResult] = await Promise.all([
      supabase.from('distributions').select('reseller_id, quantity, price_per_unit, reseller:resellers(name)'),
      supabase.from('reseller_payments').select('reseller_id, amount'),
    ])

    const distributions = distResult.data || []
    const payments = payResult.data || []

    const tagihanMap: Record<string, { name: string; tagihan: number }> = {}
    distributions.forEach((d: any) => {
      if (!d.reseller_id) return
      const name = d.reseller?.name || 'Unknown'
      if (!tagihanMap[d.reseller_id]) tagihanMap[d.reseller_id] = { name, tagihan: 0 }
      tagihanMap[d.reseller_id].tagihan += d.quantity * d.price_per_unit
    })

    const dibayarMap: Record<string, number> = {}
    payments.forEach((p: any) => {
      dibayarMap[p.reseller_id] = (dibayarMap[p.reseller_id] || 0) + p.amount
    })

    const summaries = Object.entries(tagihanMap)
      .map(([id, val]) => ({
        reseller_id: id,
        name: val.name,
        tagihan: val.tagihan,
        dibayar: dibayarMap[id] || 0,
        sisa: val.tagihan - (dibayarMap[id] || 0),
      }))
      .filter(s => s.sisa > 0)
      .sort((a, b) => b.sisa - a.sisa)

    return NextResponse.json({
      status: 'ok',
      total_piutang: summaries.reduce((s, r) => s + r.sisa, 0),
      jumlah_reseller: summaries.length,
      data: summaries,
    })
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err?.message || 'Gagal mengambil piutang' },
      { status: 500 }
    )
  }
}
