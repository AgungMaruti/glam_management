import { NextResponse } from 'next/server'
import { getClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const supabase = getClient()

  try {
    const { searchParams } = new URL(request.url)
    const periode = searchParams.get('periode') || 'minggu_ini' // hari_ini, minggu_ini, bulan_ini

    let from: string | null = null
    let to: string | null = null
    const now = new Date()

    if (periode === 'hari_ini') {
      const d = now.toISOString().split('T')[0]
      from = d; to = d
    } else if (periode === 'minggu_ini') {
      const day = now.getDay() || 7
      const mon = new Date(now)
      mon.setDate(now.getDate() - day + 1)
      from = mon.toISOString().split('T')[0]
      to = now.toISOString().split('T')[0]
    } else if (periode === 'bulan_ini') {
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      to = now.toISOString().split('T')[0]
    }

    let cfQuery = supabase.from('cashflow').select('*').order('transaction_date', { ascending: false })
    if (from) cfQuery = cfQuery.gte('transaction_date', from)
    if (to) cfQuery = cfQuery.lte('transaction_date', to + 'T23:59:59')

    const [cashflowResult, allSalesResult] = await Promise.all([
      cfQuery,
      supabase.from('sales').select('*, variant:variants(name)'),
    ])

    const cashflows = cashflowResult.data || []
    const sales = allSalesResult.data || []

    const income = cashflows.filter(c => c.type === 'income').reduce((s, c) => s + (c.amount || 0), 0)
    const expense = cashflows.filter(c => c.type === 'expense').reduce((s, c) => s + (c.amount || 0), 0)
    const saldo = income - expense

    const topProduct: Record<string, number> = {}
    sales.forEach((s: any) => {
      const n = s.variant?.name || 'Lainnya'
      topProduct[n] = (topProduct[n] || 0) + s.total_amount
    })
    const topProductSorted = Object.entries(topProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, total]) => ({ name, total }))

    return NextResponse.json({
      status: 'ok',
      periode,
      ringkasan: {
        pemasukan: income,
        pengeluaran: expense,
        saldo,
        total_transaksi: cashflows.length,
      },
      produk_laris: topProductSorted,
      transaksi_terakhir: cashflows.slice(0, 5).map((c: any) => ({
        tanggal: c.transaction_date,
        kategori: c.category,
        jenis: c.type,
        nominal: c.amount,
        keterangan: c.description || '',
      })),
    })
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err?.message || 'Gagal mengambil laporan' },
      { status: 500 }
    )
  }
}
