'use client'
import { DollarSign, TrendingUp, PackageOpen, ArrowRight } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import type { SalesHppInsight } from '@/types'

interface SalesInsightProps {
  data: SalesHppInsight | null
}

export function SalesInsight({ data }: SalesInsightProps) {
  if (!data || data.rad_count === 0) return (
    <div className="card" style={{ marginTop: 16 }}>
      <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Insight Penjualan vs HPP</h4>
      <p style={{ fontSize: 13, color: '#94A3B8' }}>
        {!data ? 'Memuat data...' : 'Lengkapi perhitungan HPP di menu RAD & HPP terlebih dahulu.'}
      </p>
    </div>
  )

  const marginSaran = data.margin_full_pct <= 0 ? '⚠️ Belum mencapai BEP — evaluasi HPP atau harga jual.'
    : data.margin_full_pct < 15 ? '⚠️ Margin tipis — stabil, tapi belum cukup buat scaling.'
    : '✅ Margin sehat — aman buat muter produksi lagi.'

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
        Insight Penjualan vs HPP (30 Hari)
      </h4>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 16px', background: '#F1F5F9', borderRadius: 10 }}>
        <DollarSign size={18} color="#6366F1" />
        <span style={{ fontSize: 13, color: '#64748B' }}>Total Penjualan:</span>
        <strong style={{ fontSize: 18, color: '#0F172A' }}>{formatRupiah(data.total_penjualan)}</strong>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>({data.unit_terjual} pcs)</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div className="card-compact" style={{ border: '1px solid #D1FAE5', background: '#ECFDF5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <PackageOpen size={14} color="#059669" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>HPP Bahan</span>
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>{formatRupiah(data.hpp_bahan_total)}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 12, color: '#64748B' }}>Profit: {formatRupiah(data.profit_bahan)}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: data.margin_bahan_pct >= 0 ? '#059669' : '#DC2626' }}>
              {data.margin_bahan_pct.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="card-compact" style={{ border: '1px solid #FEF3C7', background: '#FFFBEB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <TrendingUp size={14} color="#D97706" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#D97706' }}>HPP Full Cost</span>
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>{formatRupiah(data.hpp_full_total)}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 12, color: '#64748B' }}>Profit: {formatRupiah(data.profit_full)}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: data.margin_full_pct >= 0 ? '#059669' : '#DC2626' }}>
              {data.margin_full_pct.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {data.profit_full > 0 && (
        <div className="card-compact" style={{ border: '1px dashed #6366F1', background: '#EEF2FF', display: 'flex', alignItems: 'center', gap: 10 }}>
          <ArrowRight size={16} color="#6366F1" />
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#4338CA' }}>
              Uang bisa diputar lagi: {formatRupiah(data.uang_diputar)}
            </span>
            <p style={{ fontSize: 12, color: '#6366F1', margin: '2px 0 0' }}>
              {marginSaran}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
