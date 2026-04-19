'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Wallet, TrendingUp, ShoppingBag, AlertTriangle, LayoutDashboard, Edit2, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import PageHeader from '@/components/ui/PageHeader'

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1.5px solid #E5E2DC', borderRadius: 10, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}>
      <p style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {formatRupiah(p.value)}</p>
      ))}
    </div>
  )
}

function EditableRow({ label, value, onSave, color }: { label: string; value: number; onSave: (v: number) => void; color?: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value.toString())
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) ref.current?.select() }, [editing])
  useEffect(() => { setDraft(value.toString()) }, [value])

  const confirm = () => { onSave(parseFloat(draft) || 0); setEditing(false) }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F3F0EC' }}>
      <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input ref={ref} type="number" value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') { setDraft(value.toString()); setEditing(false) } }}
            style={{ width: 120, textAlign: 'right', fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: '1.5px solid #6366F1', background: '#EEF2FF', outline: 'none', color: color || '#111827', fontFamily: 'inherit' }}
          />
          <button onClick={confirm} style={{ width: 28, height: 28, borderRadius: 8, background: '#F0FDF4', border: 'none', color: '#16A34A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={13} /></button>
          <button onClick={() => { setDraft(value.toString()); setEditing(false) }} style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF2F2', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setEditing(true)}>
          <span style={{ fontSize: 13, fontWeight: 700, color: color || '#111827' }}>{formatRupiah(value)}</span>
          <Edit2 size={12} color="#C4C0BA" />
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalSaldo: 0, totalIncome: 0, totalExpense: 0, criticalStock: 0 })
  const [salesChart, setSalesChart] = useState<any[]>([])
  const [cfChart, setCfChart] = useState<any[]>([])
  const [criticalMaterials, setCriticalMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sellingPrice, setSellingPrice] = useState(75000)
  const [hpp, setHpp] = useState(36000)
  const [totalSold, setTotalSold] = useState(0)
  const [gaji, setGaji] = useState(0)
  const [marketing, setMarketing] = useState(0)
  const [operasional, setOperasional] = useState(0)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [cf, sales, mats, settings] = await Promise.all([
        supabase.from('cashflow').select('*'),
        supabase.from('sales').select('*, variant:variants(name)').limit(200),
        supabase.from('raw_materials').select('*'),
        supabase.from('settings').select('*'),
      ])
      const cashflows = cf.data || []
      const allSales = sales.data || []
      const materials = mats.data || []
      const sett = settings.data || []

      const sp = sett.find((s: any) => s.key === 'selling_price')
      const hp = sett.find((s: any) => s.key === 'hpp_per_unit')
      if (sp) setSellingPrice(parseFloat(sp.value))
      if (hp) setHpp(parseFloat(hp.value))

      const income = cashflows.filter(c => c.type === 'income').reduce((s, c) => s + c.amount, 0)
      const expense = cashflows.filter(c => c.type === 'expense').reduce((s, c) => s + c.amount, 0)
      setStats({ totalSaldo: income - expense, totalIncome: income, totalExpense: expense, criticalStock: materials.filter(m => m.stock <= m.min_stock).length })
      setCriticalMaterials(materials.filter(m => m.stock <= m.min_stock))
      setTotalSold(allSales.reduce((s: number, x: any) => s + x.quantity, 0))
      setGaji(cashflows.filter(c => c.category === 'Gaji Karyawan').reduce((s, c) => s + c.amount, 0))
      setMarketing(cashflows.filter(c => c.category === 'Marketing').reduce((s, c) => s + c.amount, 0))
      setOperasional(cashflows.filter(c => c.category === 'Operasional').reduce((s, c) => s + c.amount, 0))

      const byVariant: Record<string, number> = {}
      allSales.forEach((s: any) => { const n = s.variant?.name || 'Lainnya'; byVariant[n] = (byVariant[n] || 0) + s.total_amount })
      setSalesChart(Object.entries(byVariant).map(([name, total]) => ({ name, total })))

      const byMonth: Record<string, any> = {}
      cashflows.forEach(c => {
        const d = new Date(c.transaction_date)
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = d.toLocaleString('id-ID', { month: 'short', year: '2-digit' })
        if (!byMonth[k]) byMonth[k] = { month: label, income: 0, expense: 0 }
        if (c.type === 'income') byMonth[k].income += c.amount
        else byMonth[k].expense += c.amount
      })
      setCfChart(Object.values(byMonth).slice(-6))
    } catch {}
    finally { setLoading(false) }
  }

  async function saveSetting(key: string, value: number) {
    await supabase.from('settings').upsert({ key, value: value.toString(), updated_at: new Date().toISOString() })
  }

  const grossRev = sellingPrice * totalSold
  const totalHpp = hpp * totalSold
  const grossProfit = grossRev - totalHpp
  const netProfit = grossProfit - gaji - marketing - operasional
  const margin = sellingPrice > 0 ? (((sellingPrice - hpp) / sellingPrice) * 100).toFixed(1) : '0'

  if (loading) return <Spinner />

  return (
    <div className="page-sections">
      <PageHeader title="Dashboard" subtitle="Ringkasan bisnis parfum kamu" icon={LayoutDashboard} />

      {/* Stats */}
      <div className="stats-grid">
        <StatCard title="Saldo Bersih" value={formatRupiah(stats.totalSaldo)} icon={Wallet} color={stats.totalSaldo >= 0 ? 'indigo' : 'red'} />
        <StatCard title="Total Pemasukan" value={formatRupiah(stats.totalIncome)} icon={TrendingUp} color="green" />
        <StatCard title="Total Pengeluaran" value={formatRupiah(stats.totalExpense)} icon={ShoppingBag} color="amber" />
        <StatCard title="Stok Kritis" value={`${stats.criticalStock} item`} icon={AlertTriangle} color={stats.criticalStock > 0 ? 'red' : 'green'} />
      </div>

      {/* Profit Breakdown */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1.5px solid #F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Profit Breakdown</h2>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Klik nilai untuk edit · {totalSold} pcs terjual</p>
          </div>
          <span className="badge" style={{ background: '#EEF2FF', color: '#4338CA' }}>Margin {margin}%</span>
        </div>
        <div style={{ padding: '12px 16px' }} className="two-col-md">
          {/* Per unit */}
          <div style={{ background: '#F9F8F4', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Per Botol</p>
            <EditableRow label="Harga Jual / pcs" value={sellingPrice} color="#4338CA" onSave={v => { setSellingPrice(v); saveSetting('selling_price', v) }} />
            <EditableRow label="HPP / pcs" value={hpp} onSave={v => { setHpp(v); saveSetting('hpp_per_unit', v) }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Margin / pcs</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#16A34A' }}>{formatRupiah(sellingPrice - hpp)}</span>
            </div>
          </div>
          {/* Total */}
          <div style={{ background: '#FAFBFF', borderRadius: 10, padding: '12px 14px', border: '1.5px solid #E0E7FF' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Total ({totalSold} pcs)</p>
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Gross Revenue', value: grossRev, color: '#111827' },
                { label: 'Total HPP', value: -totalHpp, color: '#DC2626' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: r.color }}>{r.value < 0 ? `- ${formatRupiah(-r.value)}` : formatRupiah(r.value)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E0E7FF', paddingTop: 6 }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>Gross Profit</span>
                <span style={{ fontWeight: 700, color: '#16A34A' }}>{formatRupiah(grossProfit)}</span>
              </div>
              {gaji > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7280' }}>Gaji Karyawan</span><span style={{ color: '#D97706', fontWeight: 600 }}>- {formatRupiah(gaji)}</span></div>}
              {marketing > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7280' }}>Marketing</span><span style={{ color: '#D97706', fontWeight: 600 }}>- {formatRupiah(marketing)}</span></div>}
              {operasional > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7280' }}>Operasional</span><span style={{ color: '#D97706', fontWeight: 600 }}>- {formatRupiah(operasional)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E0E7FF', paddingTop: 8, marginTop: 2 }}>
                <span style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>NET PROFIT</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: netProfit >= 0 ? '#16A34A' : '#DC2626' }}>{formatRupiah(netProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="two-col-xl">
        <div className="card" style={{ padding: '12px 16px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 1 }}>Produk Paling Laku</h3>
          <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>Berdasarkan total penjualan</p>
          {salesChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={salesChart} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<Tip />} cursor={{ fill: '#F5F4F0' }} />
                <Bar dataKey="total" name="Penjualan" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart label="Belum ada data penjualan" />}
        </div>

        <div className="card" style={{ padding: '12px 16px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 1 }}>Tren Cashflow</h3>
          <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>6 bulan terakhir</p>
          {cfChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={cfChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Line type="monotone" dataKey="income" name="Pemasukan" stroke="#16A34A" strokeWidth={2} dot={{ fill: '#16A34A', r: 3, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="expense" name="Pengeluaran" stroke="#DC2626" strokeWidth={2} dot={{ fill: '#DC2626', r: 3, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart label="Belum ada data cashflow" />}
        </div>
      </div>

      {/* Critical stock */}
      {criticalMaterials.length > 0 && (
        <div className="card" style={{ overflow: 'hidden', borderColor: '#FCA5A5' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1.5px solid #FEE2E2', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={15} color="#DC2626" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#B91C1C' }}>Stok Kritis</p>
              <p style={{ fontSize: 11, color: '#F87171' }}>Segera lakukan restock</p>
            </div>
          </div>
          <div style={{ padding: '14px 20px', display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {criticalMaterials.map(m => (
              <div key={m.id} style={{ background: '#FEF2F2', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{m.name}</p>
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Min: {m.min_stock} {m.unit}</p>
                </div>
                <span className="badge" style={{ background: '#FEE2E2', color: '#B91C1C' }}>{m.stock} {m.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontSize: 13, color: '#D1D5DB' }}>{label}</p></div>
}

function Spinner() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}><div style={{ width: 28, height: 28, border: '2.5px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /></div>
}
