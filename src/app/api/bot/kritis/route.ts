import { NextResponse } from 'next/server'
import { getClient } from '@/lib/supabase'

export async function GET() {
  const supabase = getClient()

  try {
    const { data } = await supabase
      .from('raw_materials')
      .select('*')
      .lte('stock', 'min_stock')
      .order('stock', { ascending: true })

    const kritis = data || []

    // Hitung estimasi habis (asumsi pemakaian rata-rata per hari dari produksi 30 hari terakhir)
    const { data: prodData } = await supabase
      .from('productions')
      .select('quantity, produced_at')
      .gte('produced_at', new Date(Date.now() - 30 * 86400000).toISOString())

    const productions = prodData || []
    const totalProduksi30Hari = productions.reduce((s: number, p: any) => s + (p.quantity || 0), 0)
    const rataRataPerHari = totalProduksi30Hari / 30

    const bahanDenganEstimasi = kritis.map((b: any) => {
      const estimasiHabis = rataRataPerHari > 0 && b.stock > 0
        ? Math.round(b.stock / (rataRataPerHari * 0.5)) // asumsi 1 botol butuh setengah unit bahan (sederhana)
        : null
      return {
        ...b,
        estimasi_habis_hari: estimasiHabis,
      }
    })

    return NextResponse.json({
      status: 'ok',
      jumlah_bahan_kritis: kritis.length,
      rata_rata_produksi_harian: Math.round(rataRataPerHari * 10) / 10,
      data: bahanDenganEstimasi,
    })
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err?.message || 'Gagal mengambil data kritis' },
      { status: 500 }
    )
  }
}
