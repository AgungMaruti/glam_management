'use client'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatRupiah } from '@/lib/utils'
import type { ProductSalesData, CashflowMonthlyData } from '@/types'

interface DashboardChartsProps {
  productSales: ProductSalesData[]
  cashflowTrend: CashflowMonthlyData[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}>
      <p style={{ fontWeight: 700, color: '#334155', marginBottom: 4 }}>{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.dataKey === 'total_revenue' ? formatRupiah(p.value) : `${p.value} pcs`}</p>
      ))}
    </div>
  )
}

export function DashboardCharts({ productSales, cashflowTrend }: DashboardChartsProps) {
  if (!productSales.length && !cashflowTrend.length) return (
    <div className="card" style={{ marginTop: 16, padding: '40px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: '#94A3B8' }}>Belum ada data penjualan atau cashflow untuk ditampilkan.</p>
    </div>
  )

  return (
    <div className="card" style={{ marginTop: 16 }}>
      {productSales.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Produk Paling Laku</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={productSales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="variant_name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<Tip />} />
              <Legend />
              <Bar dataKey="total_qty" name="Terjual (pcs)" fill="#6366F1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="total_revenue" name="Revenue" fill="#A5B4FC" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {cashflowTrend.length > 0 && (
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Tren Cashflow 6 Bulan</h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={cashflowTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<Tip />} />
              <Legend />
              <Line type="monotone" dataKey="total_income" name="Pemasukan" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="total_expense" name="Pengeluaran" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
