import { NextResponse } from 'next/server'
import { getClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const supabase = getClient()

  try {
    const { searchParams } = new URL(request.url)
    const periode = searchParams.get('periode') || 'bulan_ini'

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
    } else if (periode === 'semua') {
      // no filter
    }

    let cfQuery = supabase.from('cashflow').select('*').order('transaction_date', { ascending: false })
    if (from) cfQuery = cfQuery.gte('transaction_date', from)
    if (to) cfQuery = cfQuery.lte('transaction_date', to + 'T23:59:59')

    const [cfResult, salesResult, matsResult, settingsResult, distResult, payResult] = await Promise.all([
      cfQuery,
      supabase.from('sales').select('quantity, total_amount, sold_at, variant:variants(name, selling_price)'),
      supabase.from('raw_materials').select('*'),
      supabase.from('settings').select('*'),
      supabase.from('distributions').select('quantity, price_per_unit'),
      supabase.from('reseller_payments').select('amount'),
    ])

    const cashflows = cfResult.data || []
    const sales = salesResult.data || []
    const materials = matsResult.data || []
    const settings = settingsResult.data || []
    const distributions = distResult.data || []
    const payments = payResult.data || []

    const income = cashflows.filter(c => c.type === 'income').reduce((s, c) => s + (c.amount || 0), 0)
    const expense = cashflows.filter(c => c.type === 'expense').reduce((s, c) => s + (c.amount || 0), 0)
    const saldo = income - expense

    const gaji = cashflows.filter(c => c.category === 'Gaji Karyawan').reduce((s, c) => s + (c.amount || 0), 0)
    const marketing = cashflows.filter(c => c.category === 'Marketing').reduce((s, c) => s + (c.amount || 0), 0)
    const operasional = cashflows.filter(c => c.category === 'Operasional').reduce((s, c) => s + (c.amount || 0), 0)
    const biayaTetap = gaji + marketing + operasional

    const totalSold = sales.reduce((s: number, x: any) => s + (x.quantity || 0), 0)
    const totalRevenue = sales.reduce((s: number, x: any) => s + (x.total_amount || 0), 0)

    const sp = settings.find((s: any) => s.key === 'selling_price')
    const hp = settings.find((s: any) => s.key === 'hpp_per_unit')
    const mb = settings.find((s: any) => s.key === 'modal_bisnis')
    const sellingPrice = sp ? parseFloat(sp.value) : 0
    const hpp = hp ? parseFloat(hp.value) : 0
    const modalBisnis = mb ? parseFloat(mb.value) : 0

    const marginPerBottle = sellingPrice - hpp
    const bepBotol = marginPerBottle > 0 ? Math.ceil(biayaTetap / marginPerBottle) : 0

    const piutang = distributions.reduce((s: number, d: any) => s + (d.quantity * d.price_per_unit), 0) - payments.reduce((s: number, p: any) => s + (p.amount || 0), 0)

    const kritis = materials.filter((m: any) => m.stock <= m.min_stock)

    // Analisis per kategori pengeluaran
    const kategoriPengeluaran: Record<string, number> = {}
    cashflows.filter(c => c.type === 'expense').forEach((c: any) => {
      kategoriPengeluaran[c.category] = (kategoriPengeluaran[c.category] || 0) + c.amount
    })

    return NextResponse.json({
      status: 'ok',
      periode,
      ringkasan: {
        pemasukan: income,
        pengeluaran: expense,
        saldo,
        total_terjual: totalSold,
        total_revenue: totalRevenue,
        biaya_tetap: biayaTetap,
        margin_per_botol: marginPerBottle,
        bep_botol: bepBotol,
        modal_bisnis: modalBisnis,
        profit_bersih: modalBisnis > 0 ? saldo - modalBisnis : null,
        roi: modalBisnis > 0 ? ((saldo - modalBisnis) / modalBisnis) * 100 : null,
        piutang_reseller: piutang,
      },
      detail: {
        gaji,
        marketing,
        operasional,
        kategori_pengeluaran: kategoriPengeluaran,
        bahan_kritis: kritis.map((m: any) => ({ name: m.name, stock: m.stock, min: m.min_stock })),
      },
      transaksi_terakhir: cashflows.slice(0, 10).map((c: any) => ({
        tanggal: c.transaction_date,
        kategori: c.category,
        jenis: c.type,
        nominal: c.amount,
        keterangan: c.description,
      })),
    })
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err?.message || 'Gagal mengambil data finansial' },
      { status: 500 }
    )
  }
}
