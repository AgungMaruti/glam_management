'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Wallet, TrendingUp, ShoppingBag, AlertTriangle, LayoutDashboard, Edit2, Check, X, PiggyBank, TrendingDown, Percent, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import PageHeader from '@/components/ui/PageHeader'
import Modal from '@/components/ui/Modal'
import NumInput from '@/components/ui/NumInput'

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}>
      <p style={{ fontWeight: 700, color: '#334155', marginBottom: 4 }}>{label}</p>
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ fontSize: 14, color: '#64748B' }}>{label}</span>
      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input ref={ref} type="number" value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') { setDraft(value.toString()); setEditing(false) } }}
            style={{ width: 120, textAlign: 'right', fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: '1px solid #6366F1', background: '#EEF2FF', outline: 'none', color: color || '#0F172A', fontFamily: 'inherit' }}
          />
          <button onClick={confirm} style={{ width: 28, height: 28, borderRadius: 8, background: '#F0FDF4', border: 'none', color: '#16A34A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={13} /></button>
          <button onClick={() => { setDraft(value.toString()); setEditing(false) }} style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF2F2', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setEditing(true)}>
          <span style={{ fontSize: 14, fontWeight: 700, color: color || '#0F172A' }}>{formatRupiah(value)}</span>
          <Edit2 size={12} color="#CBD5E1" />
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
  const [modalBisnis, setModalBisnis] = useState(0)
  const [kasAllTime, setKasAllTime] = useState(0)
  const [showModalBisnisModal, setShowModalBisnisModal] = useState(false)
  const [showSimulasi, setShowSimulasi] = useState(false)
  const [modalInput, setModalInput] = useState('')
  const [tambahInput, setTambahInput] = useState('')
  const [catatCashflow, setCatatCashflow] = useState(true)
  const [savingModal, setSavingModal] = useState(false)
  const [modalMode, setModalMode] = useState<'set' | 'tambah'>('set')
  const [totalSoldBulanIni, setTotalSoldBulanIni] = useState(0)
  const [totalPiutang, setTotalPiutang] = useState(0)
  const [resellerSummaries, setResellerSummaries] = useState<{ name: string; sisa: number }[]>([])

  type Periode = 'hari_ini' | 'minggu_ini' | 'bulan_ini' | 'semua'
  const [periode, setPeriode] = useState<Periode>('bulan_ini')

  function getDateRange(p: Periode): { from: string | null; to: string | null } {
    const now = new Date()
    if (p === 'semua') return { from: null, to: null }
    if (p === 'hari_ini') {
      const d = now.toISOString().split('T')[0]
      return { from: d, to: d }
    }
    if (p === 'minggu_ini') {
      const day = now.getDay() || 7
      const mon = new Date(now)
      mon.setDate(now.getDate() - day + 1)
      return { from: mon.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
    }
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    return { from, to: now.toISOString().split('T')[0] }
  }

  useEffect(() => { load() }, [periode])

  async function load() {
    try {
      const { from, to } = getDateRange(periode)
      const now = new Date()
      const bulanFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

      let cfQuery = supabase.from('cashflow').select('*')
      if (from) cfQuery = cfQuery.gte('transaction_date', from)
      if (to) cfQuery = cfQuery.lte('transaction_date', to + 'T23:59:59')

      const [cf, allCf, sales, mats, settings, salesBulanIni, distRes, paymentsRes] = await Promise.all([
        cfQuery,
        supabase.from('cashflow').select('type, amount, category'),
        supabase.from('sales').select('*, variant:variants(name)').limit(200),
        supabase.from('raw_materials').select('*'),
        supabase.from('settings').select('*'),
        supabase.from('sales').select('quantity').gte('sold_at', bulanFrom),
        supabase.from('distributions').select('reseller_id, quantity, price_per_unit, reseller:resellers(name)'),
        supabase.from('reseller_payments').select('reseller_id, amount'),
      ])
      const cashflows = cf.data || []
      const allCashflows = allCf.data || []
      const allSales = sales.data || []
      const materials = mats.data || []
      const sett = settings.data || []

      const sp  = sett.find((s: any) => s.key === 'selling_price')
      const hp  = sett.find((s: any) => s.key === 'hpp_per_unit')
      const mb  = sett.find((s: any) => s.key === 'modal_bisnis')
      if (sp) setSellingPrice(parseFloat(sp.value))
      if (hp) setHpp(parseFloat(hp.value))
      if (mb) setModalBisnis(parseFloat(mb.value))

      // Stats cards menggunakan cashflow terfilter
      const income = cashflows.filter(c => c.type === 'income').reduce((s, c) => s + c.amount, 0)
      const expense = cashflows.filter(c => c.type === 'expense').reduce((s, c) => s + c.amount, 0)
      setStats({ totalSaldo: income - expense, totalIncome: income, totalExpense: expense, criticalStock: materials.filter(m => m.stock <= m.min_stock).length })
      setCriticalMaterials(materials.filter(m => m.stock <= m.min_stock))

      // Kas ALL TIME untuk Modal Tracker / ROI
      const allIncome = allCashflows.filter(c => c.type === 'income').reduce((s, c) => s + c.amount, 0)
      const allExpense = allCashflows.filter(c => c.type === 'expense').reduce((s, c) => s + c.amount, 0)
      setKasAllTime(allIncome - allExpense)

      setTotalSold(allSales.reduce((s: number, x: any) => s + x.quantity, 0))
      setGaji(cashflows.filter(c => c.category === 'Gaji Karyawan').reduce((s, c) => s + c.amount, 0))
      setMarketing(cashflows.filter(c => c.category === 'Marketing').reduce((s, c) => s + c.amount, 0))
      setOperasional(cashflows.filter(c => c.category === 'Operasional').reduce((s, c) => s + c.amount, 0))
      setTotalSoldBulanIni((salesBulanIni.data || []).reduce((s: number, x: any) => s + x.quantity, 0))

      // Hitung piutang reseller
      const distributions = distRes.data || []
      const payments = paymentsRes.data || []
      const tagihanMap: Record<string, { name: string; tagihan: number }> = {}
      distributions.forEach((d: any) => {
        if (!d.reseller_id) return
        const name = d.reseller?.name || 'Unknown'
        if (!tagihanMap[d.reseller_id]) tagihanMap[d.reseller_id] = { name, tagihan: 0 }
        tagihanMap[d.reseller_id].tagihan += d.quantity * d.price_per_unit
      })
      const dibayarMap: Record<string, number> = {}
      payments.forEach((p: any) => { dibayarMap[p.reseller_id] = (dibayarMap[p.reseller_id] || 0) + p.amount })
      const summaries = Object.entries(tagihanMap)
        .map(([id, val]) => ({ name: val.name, sisa: val.tagihan - (dibayarMap[id] || 0) }))
        .filter(s => s.sisa > 0)
      setResellerSummaries(summaries)
      setTotalPiutang(summaries.reduce((s, r) => s + r.sisa, 0))

      const byVariant: Record<string, number> = {}
      allSales.forEach((s: any) => { const n = s.variant?.name || 'Lainnya'; byVariant[n] = (byVariant[n] || 0) + s.total_amount })
      setSalesChart(Object.entries(byVariant).map(([name, total]) => ({ name, total })))

      const byMonth: Record<string, any> = {}
      cashflows.forEach(c => {
        const d = new Date(c.transaction_date)
        if (isNaN(d.getTime()) || d.getFullYear() < 2000) return
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

  async function saveModalBisnis() {
    setSavingModal(true)
    if (modalMode === 'set') {
      const val = parseFloat(modalInput) || 0
      await supabase.from('settings').upsert({ key: 'modal_bisnis', value: val.toString(), updated_at: new Date().toISOString() })
      setModalBisnis(val)
    } else {
      const tambah = parseFloat(tambahInput) || 0
      const newTotal = modalBisnis + tambah
      await supabase.from('settings').upsert({ key: 'modal_bisnis', value: newTotal.toString(), updated_at: new Date().toISOString() })
      if (catatCashflow && tambah > 0) {
        await supabase.from('cashflow').insert({
          type: 'income', category: 'Penambahan Modal',
          amount: tambah,
          description: `Tambah modal bisnis`,
          transaction_date: new Date().toISOString(),
        })
      }
      setModalBisnis(newTotal)
    }
    setModalInput(''); setTambahInput('')
    setShowModalBisnisModal(false); setSavingModal(false)
    load()
  }

  const kasSekarang = kasAllTime
  const profitBersih = modalBisnis > 0 ? kasSekarang - modalBisnis : null
  const roi = modalBisnis > 0 && profitBersih !== null ? (profitBersih / modalBisnis) * 100 : null

  const grossRev = sellingPrice * totalSold
  const totalHpp = hpp * totalSold
  const grossProfit = grossRev - totalHpp
  const netProfit = grossProfit - gaji - marketing - operasional
  const margin = sellingPrice > 0 ? (((sellingPrice - hpp) / sellingPrice) * 100).toFixed(1) : '0'

  const marginPerBottle = sellingPrice - hpp
  const biayaTetapBulanIni = gaji + marketing + operasional
  const bepBotol = periode === 'bulan_ini' && marginPerBottle > 0 ? Math.ceil(biayaTetapBulanIni / marginPerBottle) : 0
  const bepTercapai = totalSoldBulanIni >= bepBotol

  if (loading) return <Spinner />

  return (
    <div className="page-sections">
      <PageHeader title="Dashboard" subtitle="Ringkasan bisnis parfum kamu" icon={LayoutDashboard} />

      {/* Filter Periode */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {([
          { key: 'hari_ini', label: 'Hari Ini' },
          { key: 'minggu_ini', label: 'Minggu Ini' },
          { key: 'bulan_ini', label: 'Bulan Ini' },
          { key: 'semua', label: 'Semua' },
        ] as { key: typeof periode; label: string }[]).map(opt => (
          <button key={opt.key} onClick={() => setPeriode(opt.key)}
            style={{
              padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: periode === opt.key ? '#6366F1' : '#F1F5F9',
              color: periode === opt.key ? '#fff' : '#64748B',
              transition: 'all .15s',
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard title="Saldo" value={formatRupiah(stats.totalSaldo)} icon={Wallet} color={stats.totalSaldo >= 0 ? 'indigo' : 'red'} />
        <StatCard title="Total Pemasukan" value={formatRupiah(stats.totalIncome)} icon={TrendingUp} color="green" />
        <StatCard title="Total Pengeluaran" value={formatRupiah(stats.totalExpense)} icon={ShoppingBag} color="amber" />
        <StatCard title="Stok Kritis" value={`${stats.criticalStock} item`} icon={AlertTriangle} color={stats.criticalStock > 0 ? 'red' : 'green'} />
        {totalPiutang > 0 && (
          <StatCard title="Piutang Reseller" value={formatRupiah(totalPiutang)} icon={Wallet} color="amber" />
        )}
      </div>

      {/* Piutang per Reseller */}
      {resellerSummaries.length > 0 && (
        <div className="card" style={{ padding: '16px 20px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Piutang Per Reseller</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resellerSummaries.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#FEF3C7', borderRadius: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>{r.name}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#D97706' }}>{formatRupiah(r.sisa)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal & Profit Tracker */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Modal & Profit Tracker</h2>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>Pantau modal kamu vs hasil yang udah didapat</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {modalBisnis > 0 && (
              <button onClick={() => { setModalMode('tambah'); setTambahInput(''); setCatatCashflow(true); setShowModalBisnisModal(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '7px 12px', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#DCFCE7'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#F0FDF4'}>
                <Plus size={13} /> Tambah Modal
              </button>
            )}
            <button onClick={() => { setModalMode('set'); setModalInput(modalBisnis > 0 ? modalBisnis.toString() : ''); setShowModalBisnisModal(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#6366F1', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, padding: '7px 12px', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#E0E7FF'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#EEF2FF'}>
              <Edit2 size={12} /> {modalBisnis > 0 ? 'Edit Modal' : 'Set Modal Awal'}
            </button>
          </div>
        </div>

        {modalBisnis === 0 ? (
          <div style={{ padding: '28px 20px', textAlign: 'center' }}>
            <PiggyBank size={32} color="#E2E8F0" style={{ margin: '0 auto 10px' }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>Belum ada modal yang dicatat</p>
            <p style={{ fontSize: 13, color: '#CBD5E1' }}>Set modal awal kamu untuk mulai tracking profit & ROI</p>
          </div>
        ) : (
          <div style={{ padding: '16px 20px' }}>
            <div className="two-col-sm" style={{ gap: 12 }}>
              {/* Modal */}
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PiggyBank size={13} color="#6366F1" />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Total Modal Ditanam</p>
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#4338CA', letterSpacing: '-0.03em' }}>{formatRupiah(modalBisnis)}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>Uang yang kamu investasikan ke bisnis</p>
              </div>

              {/* Kas */}
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet size={13} color="#10B981" />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Kas Bisnis Saat Ini</p>
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#059669', letterSpacing: '-0.03em' }}>{formatRupiah(kasSekarang)}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>Total uang yang ada sekarang</p>
              </div>

              {/* Profit */}
              <div style={{ background: profitBersih !== null && profitBersih >= 0 ? '#F0FDF4' : '#FEF2F2', borderRadius: 10, padding: '14px 16px', border: `1px solid ${profitBersih !== null && profitBersih >= 0 ? '#BBF7D0' : '#FECACA'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: profitBersih !== null && profitBersih >= 0 ? '#DCFCE7' : '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={13} color={profitBersih !== null && profitBersih >= 0 ? '#16A34A' : '#DC2626'} />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Profit Bersih</p>
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: profitBersih !== null && profitBersih >= 0 ? '#16A34A' : '#DC2626' }}>
                  {profitBersih !== null ? (profitBersih >= 0 ? '+' : '') + formatRupiah(profitBersih) : '-'}
                </p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>Kas sekarang dikurangi modal awal</p>
              </div>

              {/* ROI */}
              <div style={{ background: roi !== null && roi >= 0 ? '#F5F3FF' : '#FEF2F2', borderRadius: 10, padding: '14px 16px', border: `1px solid ${roi !== null && roi >= 0 ? '#DDD6FE' : '#FECACA'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: roi !== null && roi >= 0 ? '#EDE9FE' : '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Percent size={13} color={roi !== null && roi >= 0 ? '#7C3AED' : '#DC2626'} />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>ROI (Return on Investment)</p>
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: roi !== null && roi >= 0 ? '#7C3AED' : '#DC2626' }}>
                  {roi !== null ? `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%` : '-'}
                </p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
                  {roi !== null && roi >= 0 ? `Modal kamu sudah balik ${(roi / 100 + 1).toFixed(2)}× lipat` : 'Modal belum balik'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BEP Bisnis */}
      {periode === 'bulan_ini' && bepBotol > 0 && (
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: bepTercapai ? '#DCFCE7' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={15} color={bepTercapai ? '#16A34A' : '#D97706'} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>BEP Bulan Ini</h3>
              <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>Titik balik modal operasional</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={{ textAlign: 'center', background: '#F8FAFC', borderRadius: 8, padding: '10px 8px' }}>
              <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>Minimal Jual</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{bepBotol}</p>
              <p style={{ fontSize: 10, color: '#94A3B8' }}>botol</p>
            </div>
            <div style={{ textAlign: 'center', background: '#F8FAFC', borderRadius: 8, padding: '10px 8px' }}>
              <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>Sudah Terjual</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: bepTercapai ? '#16A34A' : '#D97706' }}>{totalSoldBulanIni}</p>
              <p style={{ fontSize: 10, color: '#94A3B8' }}>botol</p>
            </div>
            <div style={{ textAlign: 'center', background: bepTercapai ? '#F0FDF4' : '#FEF3C7', borderRadius: 8, padding: '10px 8px' }}>
              <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>{bepTercapai ? 'Lebih' : 'Kurang'}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: bepTercapai ? '#16A34A' : '#D97706' }}>
                {bepTercapai ? `+${totalSoldBulanIni - bepBotol}` : bepBotol - totalSoldBulanIni}
              </p>
              <p style={{ fontSize: 10, color: '#94A3B8' }}>botol</p>
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: bepTercapai ? '#16A34A' : '#D97706',
              width: `${Math.min((totalSoldBulanIni / Math.max(bepBotol, 1)) * 100, 100)}%`,
              transition: 'width .4s',
            }} />
          </div>
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, textAlign: 'center' }}>
            {bepTercapai
              ? `✅ BEP tercapai! Kamu sudah untung dari ops bulan ini.`
              : `⚠️ Butuh ${bepBotol - totalSoldBulanIni} botol lagi untuk nutup biaya ops bulan ini.`}
          </p>
        </div>
      )}

      {/* Modal Bisnis Dialog */}
      <Modal open={showModalBisnisModal} onClose={() => setShowModalBisnisModal(false)} title={modalMode === 'set' ? (modalBisnis > 0 ? 'Edit Modal Bisnis' : 'Set Modal Awal') : 'Tambah Modal'} size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {modalMode === 'set' ? (
            <>
              <div style={{ background: '#EEF2FF', borderRadius: 10, padding: '12px 14px', border: '1px solid #C7D2FE' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#3730A3', marginBottom: 4 }}>Apa itu Modal Bisnis?</p>
                <p style={{ fontSize: 12, color: '#4338CA', lineHeight: 1.6 }}>Total uang yang kamu investasikan ke bisnis ini sejak awal. Digunakan untuk menghitung profit bersih dan ROI kamu.</p>
              </div>
              <div>
                <label style={lbl}>Total Modal yang Ditanam (Rp) *</label>
                <NumInput placeholder="1.000.000" value={modalInput} onChange={setModalInput} autoFocus />
              </div>
              {modalInput && (
                <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '12px 14px', border: '1px solid #BBF7D0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Kas Saat Ini</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>{formatRupiah(kasSekarang)}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Profit Bersih</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: kasSekarang - (parseFloat(modalInput) || 0) >= 0 ? '#16A34A' : '#DC2626' }}>
                      {formatRupiah(kasSekarang - (parseFloat(modalInput) || 0))}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Modal saat ini</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Setelah tambahan, modal jadi</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#4338CA' }}>{formatRupiah(modalBisnis)}</p>
                  {tambahInput && <p style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', marginTop: 2 }}>→ {formatRupiah(modalBisnis + (parseFloat(tambahInput) || 0))}</p>}
                </div>
              </div>
              <div>
                <label style={lbl}>Jumlah Tambahan Modal (Rp) *</label>
                <NumInput placeholder="500.000" value={tambahInput} onChange={setTambahInput} autoFocus />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 10, background: catatCashflow ? '#EEF2FF' : '#F8FAFC', border: `1.5px solid ${catatCashflow ? '#C7D2FE' : '#E2E8F0'}`, transition: 'all .15s' }}>
                <input type="checkbox" checked={catatCashflow} onChange={e => setCatatCashflow(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#6366F1', cursor: 'pointer' }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Catat ke Cashflow</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>Auto-input sebagai pemasukan "Penambahan Modal"</p>
                </div>
              </label>
            </>
          )}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={() => setShowModalBisnisModal(false)}
              style={{ flex: 1, padding: '9px', borderRadius: 9, border: '1px solid #E2E8F0', background: '#fff', fontSize: 14, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>
              Batal
            </button>
            <button onClick={saveModalBisnis} disabled={savingModal || (modalMode === 'set' ? !modalInput : !tambahInput)}
              style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: '#6366F1', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', opacity: (savingModal || (modalMode === 'set' ? !modalInput : !tambahInput)) ? 0.5 : 1 }}>
              {savingModal ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Profit Breakdown */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Profit Breakdown</h2>
            <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>Klik nilai untuk edit · {totalSold} pcs terjual</p>
          </div>
          <span className="badge" style={{ background: '#EEF2FF', color: '#4338CA', fontSize: 12, padding: '4px 10px' }}>Margin {margin}%</span>
        </div>
        <div style={{ padding: '16px 20px' }} className="two-col-md">
          {/* Per unit */}
          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Per Botol</p>
            <EditableRow label="Harga Jual / pcs" value={sellingPrice} color="#4338CA" onSave={v => { setSellingPrice(v); saveSetting('selling_price', v) }} />
            <EditableRow label="HPP / pcs" value={hpp} onSave={v => { setHpp(v); saveSetting('hpp_per_unit', v) }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Margin / pcs</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#16A34A' }}>{formatRupiah(sellingPrice - hpp)}</span>
            </div>
          </div>
          {/* Total */}
          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px', border: '1px solid #C7D2FE' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Total ({totalSold} pcs)</p>
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Gross Revenue', value: grossRev, color: '#0F172A' },
                { label: 'Total HPP', value: -totalHpp, color: '#DC2626' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: r.color }}>{r.value < 0 ? `- ${formatRupiah(-r.value)}` : formatRupiah(r.value)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #C7D2FE', paddingTop: 6 }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Gross Profit</span>
                <span style={{ fontWeight: 700, color: '#16A34A' }}>{formatRupiah(grossProfit)}</span>
              </div>
              {gaji > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748B' }}>Gaji Karyawan</span><span style={{ color: '#D97706', fontWeight: 600 }}>- {formatRupiah(gaji)}</span></div>}
              {marketing > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748B' }}>Marketing</span><span style={{ color: '#D97706', fontWeight: 600 }}>- {formatRupiah(marketing)}</span></div>}
              {operasional > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748B' }}>Operasional</span><span style={{ color: '#D97706', fontWeight: 600 }}>- {formatRupiah(operasional)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #C7D2FE', paddingTop: 8, marginTop: 2 }}>
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 15 }}>NET PROFIT</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: netProfit >= 0 ? '#16A34A' : '#DC2626' }}>{formatRupiah(netProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="two-col-xl" style={{ flex: 1 }}>
        <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', minHeight: 280 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>Produk Paling Laku</h3>
          <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>Berdasarkan total penjualan</p>
          <div style={{ flex: 1, minHeight: 200 }}>
            {salesChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChart} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<Tip />} cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="total" name="Penjualan" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart label="Belum ada data penjualan" />}
          </div>
        </div>

        <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', minHeight: 280 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>Tren Cashflow</h3>
          <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>6 bulan terakhir</p>
          <div style={{ flex: 1, minHeight: 200 }}>
            {cfChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cfChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="income" name="Pemasukan" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="expense" name="Pengeluaran" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 3, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart label="Belum ada data cashflow" />}
          </div>
        </div>
      </div>

      {/* Critical stock */}
      {criticalMaterials.length > 0 && (
        <div className="card" style={{ overflow: 'hidden', borderColor: '#FCA5A5' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} color="#DC2626" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#B91C1C' }}>Stok Kritis</p>
              <p style={{ fontSize: 12, color: '#F87171' }}>Segera lakukan restock</p>
            </div>
          </div>
          <div style={{ padding: '12px 16px', display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {criticalMaterials.map(m => (
              <div key={m.id} style={{ background: '#FEF2F2', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{m.name}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Min: {m.min_stock} {m.unit}</p>
                </div>
                <span className="badge" style={{ background: '#FEE2E2', color: '#B91C1C' }}>{m.stock} {m.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Simulasi Button */}
      {profitBersih !== null && profitBersih > 0 && hpp > 0 && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          {showSimulasi && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 8px 32px rgba(15,23,42,.15)', border: '1px solid #E2E8F0', width: 240 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Simulasi Produksi</p>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 12 }}>
                Dengan profit bersih <strong style={{ color: '#16A34A' }}>{formatRupiah(profitBersih)}</strong>, kamu bisa produksi lagi:
              </p>
              <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '14px 16px', textAlign: 'center', border: '1px solid #BBF7D0' }}>
                <p style={{ fontSize: 36, fontWeight: 800, color: '#16A34A', lineHeight: 1 }}>{Math.floor(profitBersih / hpp)}</p>
                <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>pcs produk</p>
              </div>
              <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 10 }}>HPP {formatRupiah(hpp)}/pcs · dari profit, bukan modal</p>
            </div>
          )}
          <button onClick={() => setShowSimulasi(s => !s)}
            style={{ width: 52, height: 52, borderRadius: '50%', background: showSimulasi ? '#16A34A' : '#6366F1', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,.4)', fontSize: 22, transition: 'background .2s' }}>
            {showSimulasi ? '×' : '🔮'}
          </button>
        </div>
      )}
    </div>
  )
}

const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }

function EmptyChart({ label }: { label: string }) {
  return (
    <div style={{ height: '100%', minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, background: '#F8FAFC', border: '1.5px dashed #E2E8F0' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      </div>
      <p style={{ fontSize: 12, color: '#CBD5E1', fontWeight: 500 }}>{label}</p>
    </div>
  )
}

function Spinner() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}><div style={{ width: 28, height: 28, border: '2.5px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /></div>
}
