import { NextResponse } from 'next/server'
import { getClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = getClient()

  try {
    const body = await request.json()
    const { jenis, kategori, nominal, keterangan, tanggal } = body

    if (!jenis || !kategori || !nominal) {
      return NextResponse.json(
        { status: 'error', message: 'jenis, kategori, dan nominal wajib diisi' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.from('cashflow').insert({
      type: jenis, // 'income' atau 'expense'
      category: kategori,
      amount: parseFloat(nominal),
      description: keterangan || '',
      transaction_date: tanggal || new Date().toISOString().split('T')[0],
    }).select().single()

    if (error) throw error

    return NextResponse.json({
      status: 'ok',
      message: `${jenis === 'income' ? 'Pemasukan' : 'Pengeluaran'} Rp ${nominal} berhasil dicatat`,
      data,
    })
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err?.message || 'Gagal mencatat transaksi' },
      { status: 500 }
    )
  }
}
