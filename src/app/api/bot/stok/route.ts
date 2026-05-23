import { NextResponse } from 'next/server'
import { getClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const supabase = getClient()

  try {
    const { searchParams } = new URL(request.url)
    const nama = searchParams.get('nama')
    const jenis = searchParams.get('jenis') || 'semua' // bahan, produk, semua

    let response: any = {}

    if (jenis === 'bahan' || jenis === 'semua') {
      if (nama) {
        const { data } = await supabase
          .from('raw_materials')
          .select('*')
          .ilike('name', `%${nama}%`)
          .order('name')
        response.bahan = data || []
      } else {
        const { data } = await supabase
          .from('raw_materials')
          .select('*')
          .order('name')
        response.bahan = data || []
      }
    }

    if (jenis === 'produk' || jenis === 'semua') {
      if (nama) {
        const { data } = await supabase
          .from('variants')
          .select('*, product:products(name)')
          .ilike('name', `%${nama}%`)
          .order('name')
        response.produk = data || []
      } else {
        const { data } = await supabase
          .from('variants')
          .select('*, product:products(name)')
          .order('name')
        response.produk = data || []
      }
    }

    return NextResponse.json({
      status: 'ok',
      data: response,
    })
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err?.message || 'Gagal mengambil stok' },
      { status: 500 }
    )
  }
}
