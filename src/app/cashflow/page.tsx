'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { TrendingUp, Plus, Trash2, ArrowUpCircle, ArrowDownCircle, ShoppingBag, Wallet, Edit2, Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils'
import { Cashflow, Variant } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import NumInput from '@/components/ui/NumInput'

type Period = 'daily' | 'weekly' | 'monthly' | 'all'

const INCOME_CATS = ['Penjualan', 'Reseller', 'Dropship', 'Lainnya']
const EXPENSE_CATS = ['Produksi', 'Gaji Karyawan', 'Marketing', 'Packaging', 'Ongkir', 'Operasional', 'Lainnya']
const ALL_CATS = [...INCOME_CATS, ...EXPENSE_CATS.filter(c => !INCOME_CATS.includes(c))]
const defaultForm = { type: 'income' as 'income' | 'expense', category: '', amount: '', description: '', transaction_date: new Date().toISOString().slice(0, 10) }

function printLaporan(data: {
  rows: Cashflow[],
  saldoAwal: number,
  filterLabel: string,
  printType: string,
  printCat: string,
}) {
  const { rows, saldoAwal, filterLabel, printType, printCat } = data

  // filter by type & category
  let filtered = rows.filter(c => c.category !== 'Saldo Awal')
  if (printType !== 'all') filtered = filtered.filter(c => c.type === printType)
  if (printCat !== 'all') filtered = filtered.filter(c => c.category === printCat)

  // sort ascending for running balance
  const sorted = [...filtered].sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())

  const totalIn = sorted.filter(c => c.type === 'income').reduce((s, c) => s + c.amount, 0)
  const totalOut = sorted.filter(c => c.type === 'expense').reduce((s, c) => s + c.amount, 0)

  let running = saldoAwal
  const rowsHtml = sorted.map((c, i) => {
    const masuk = c.type === 'income' ? c.amount : 0
    const keluar = c.type === 'expense' ? c.amount : 0
    running += masuk - keluar
    const tgl = new Date(c.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${tgl}</td>
        <td><b>${c.category}</b>${c.description ? `<br><small>${c.description}</small>` : ''}</td>
        <td class="in">${masuk ? formatRupiah(masuk) : ''}</td>
        <td class="out">${keluar ? formatRupiah(keluar) : ''}</td>
        <td class="bal">${formatRupiah(running)}</td>
      </tr>`
  }).join('')

  const now = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const typeLabel = printType === 'all' ? 'Semua Transaksi' : printType === 'income' ? 'Pemasukan' : 'Pengeluaran'
  const catLabel = printCat !== 'all' ? ` · Kategori: ${printCat}` : ''

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Keuangan — Glam Suite</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 32px; }
  .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #111; padding-bottom: 16px; }
  .header h1 { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
  .header h2 { font-size: 13px; font-weight: 600; color: #444; margin-top: 4px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 11px; color: #555; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #111; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  td small { color: #888; font-size: 10px; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .in { color: #16a34a; font-weight: 700; text-align: right; }
  .out { color: #dc2626; font-weight: 700; text-align: right; }
  .bal { font-weight: 700; text-align: right; }
  th:nth-child(4), th:nth-child(5), th:nth-child(6) { text-align: right; }
  .summary { display: flex; gap: 16px; margin-top: 8px; }
  .summary-box { flex: 1; border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px 16px; }
  .summary-box p { font-size: 11px; color: #666; margin-bottom: 4px; }
  .summary-box b { font-size: 15px; }
  .footer { margin-top: 24px; text-align: right; font-size: 10px; color: #aaa; border-top: 1px solid #e5e5e5; padding-top: 10px; }
  @media print {
    body { padding: 16px; }
    @page { margin: 1.5cm; size: A4; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>✦ GLAM SUITE</h1>
    <h2>LAPORAN KEUANGAN — ${typeLabel.toUpperCase()}${catLabel.toUpperCase()}</h2>
  </div>
  <div class="meta">
    <span>Periode: <b>${filterLabel}</b></span>
    <span>Dicetak: ${now}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:36px">No</th>
        <th style="width:90px">Tanggal</th>
        <th>Keterangan</th>
        <th style="width:120px">Masuk</th>
        <th style="width:120px">Keluar</th>
        <th style="width:130px">Saldo</th>
      </tr>
    </thead>
    <tbody>
      ${saldoAwal > 0 ? `<tr><td>—</td><td>—</td><td><b>Saldo Awal</b></td><td class="in">${formatRupiah(saldoAwal)}</td><td></td><td class="bal">${formatRupiah(saldoAwal)}</td></tr>` : ''}
      ${rowsHtml || '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:24px">Tidak ada transaksi</td></tr>'}
    </tbody>
  </table>
  <div class="summary">
    <div class="summary-box">
      <p>Total Pemasukan</p>
      <b style="color:#16a34a">${formatRupiah(totalIn)}</b>
    </div>
    <div class="summary-box">
      <p>Total Pengeluaran</p>
      <b style="color:#dc2626">${formatRupiah(totalOut)}</b>
    </div>
    <div class="summary-box">
      <p>Saldo Akhir</p>
      <b style="color:${running >= 0 ? '#1d4ed8' : '#dc2626'}">${formatRupiah(running)}</b>
    </div>
  </div>
  <div class="footer">Glam Suite · Laporan dibuat otomatis · ${sorted.length} transaksi</div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

export default function CashflowPage() {
  const [cashflows, setCashflows] = useState<Cashflow[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [period, setPeriod] = useState<Period>('monthly')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showSaldoModal, setShowSaldoModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saleForm, setSaleForm] = useState({ variant_id: '', quantity: '', unit_price: '', notes: '' })
  const [saldoAwal, setSaldoAwal] = useState<Cashflow | null>(null)
  const [saldoInput, setSaldoInput] = useState('')

  // Print filters
  const [printPeriod, setPrintPeriod] = useState<Period>('monthly')
  const [printDateFrom, setPrintDateFrom] = useState('')
  const [printDateTo, setPrintDateTo] = useState('')
  const [printType, setPrintType] = useState('all')
  const [printCat, setPrintCat] = useState('all')
  const [useCustomDate, setUseCustomDate] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [cf, vr] = await Promise.all([
      supabase.from('cashflow').select('*').order('transaction_date', { ascending: false }),
      supabase.from('variants').select('*').order('name'),
    ])
    const all = cf.data || []
    setCashflows(all)
    setVariants(vr.data || [])
    const sa = all.find(c => c.category === 'Saldo Awal')
    setSaldoAwal(sa || null)
    setLoading(false)
  }

  function filterByPeriodKey(items: Cashflow[], p: Period) {
    const txs = items.filter(c => c.category !== 'Saldo Awal')
    const now = new Date()
    if (p === 'all') return txs
    return txs.filter(c => {
      const d = new Date(c.transaction_date)
      if (p === 'daily') return d.toDateString() === now.toDateString()
      if (p === 'weekly') { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w }
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
  }

  const filtered = filterByPeriodKey(cashflows, period)
  const saldoAwalAmount = saldoAwal?.amount || 0
  const allTxs = cashflows.filter(c => c.category !== 'Saldo Awal')
  const allIncome = allTxs.filter(c => c.type === 'income').reduce((s, c) => s + c.amount, 0)
  const allExpense = allTxs.filter(c => c.type === 'expense').reduce((s, c) => s + c.amount, 0)
  const currentBalance = saldoAwalAmount + allIncome - allExpense
  const periodIncome = filtered.filter(c => c.type === 'income').reduce((s, c) => s + c.amount, 0)
  const periodExpense = filtered.filter(c => c.type === 'expense').reduce((s, c) => s + c.amount, 0)

  function getPrintRows() {
    let rows = cashflows.filter(c => c.category !== 'Saldo Awal')
    if (useCustomDate && printDateFrom) rows = rows.filter(c => new Date(c.transaction_date) >= new Date(printDateFrom))
    if (useCustomDate && printDateTo) rows = rows.filter(c => new Date(c.transaction_date) <= new Date(printDateTo + 'T23:59:59'))
    if (!useCustomDate) rows = filterByPeriodKey(cashflows, printPeriod)
    return rows
  }

  function getPrintFilterLabel() {
    if (useCustomDate) {
      const from = printDateFrom ? new Date(printDateFrom).toLocaleDateString('id-ID') : '—'
      const to = printDateTo ? new Date(printDateTo).toLocaleDateString('id-ID') : '—'
      return `${from} s/d ${to}`
    }
    const map: Record<Period, string> = { daily: 'Hari Ini', weekly: 'Minggu Ini', monthly: 'Bulan Ini', all: 'Semua Waktu' }
    return map[printPeriod]
  }

  function handlePrint() {
    printLaporan({
      rows: getPrintRows(),
      saldoAwal: saldoAwalAmount,
      filterLabel: getPrintFilterLabel(),
      printType,
      printCat,
    })
    setShowPrintModal(false)
  }

  async function saveSaldoAwal() {
    if (!saldoInput) return
    setSaving(true)
    const amount = parseFloat(saldoInput)
    if (saldoAwal) {
      await supabase.from('cashflow').update({ amount, description: 'Saldo rekening awal' }).eq('id', saldoAwal.id)
    } else {
      await supabase.from('cashflow').insert({ type: 'income', category: 'Saldo Awal', amount, description: 'Saldo rekening awal', transaction_date: new Date(0).toISOString() })
    }
    setSaldoInput(''); setShowSaldoModal(false); setSaving(false); load()
  }

  async function saveCashflow() {
    if (!form.category || !form.amount) return
    setSaving(true)
    await supabase.from('cashflow').insert({ type: form.type, category: form.category, amount: parseFloat(form.amount), description: form.description, transaction_date: form.transaction_date })
    setForm(defaultForm); setShowModal(false); setSaving(false); load()
  }

  async function saveSale() {
    if (!saleForm.variant_id || !saleForm.quantity || !saleForm.unit_price) return
    setSaving(true)
    const qty = parseInt(saleForm.quantity)
    const price = parseFloat(saleForm.unit_price)
    const total = qty * price
    const v = variants.find(v => v.id === saleForm.variant_id)
    if (!v) { setSaving(false); return }
    if (v.stock < qty) { alert(`Stok tidak cukup! Tersedia: ${v.stock} pcs`); setSaving(false); return }
    await supabase.from('sales').insert({ variant_id: saleForm.variant_id, quantity: qty, unit_price: price, total_amount: total, notes: saleForm.notes })
    await supabase.from('variants').update({ stock: v.stock - qty }).eq('id', saleForm.variant_id)
    await supabase.from('cashflow').insert({ type: 'income', category: 'Penjualan', amount: total, description: `Jual ${qty} pcs ${v.name} @ ${formatRupiah(price)}`, transaction_date: new Date().toISOString() })
    setSaleForm({ variant_id: '', quantity: '', unit_price: '', notes: '' }); setShowSaleModal(false); setSaving(false); load()
  }

  async function deleteCashflow(id: string) {
    await supabase.from('cashflow').delete().eq('id', id); load()
  }

  const periods: { key: Period; label: string }[] = [
    { key: 'daily', label: 'Hari Ini' },
    { key: 'weekly', label: 'Minggu Ini' },
    { key: 'monthly', label: 'Bulan Ini' },
    { key: 'all', label: 'Semua' },
  ]

  const printRows = getPrintRows()
  const printPreviewIn = printRows.filter(c => (printType === 'all' || printType === 'income') && c.type === 'income' && (printCat === 'all' || c.category === printCat)).reduce((s, c) => s + c.amount, 0)
  const printPreviewOut = printRows.filter(c => (printType === 'all' || printType === 'expense') && c.type === 'expense' && (printCat === 'all' || c.category === printCat)).reduce((s, c) => s + c.amount, 0)
  const printPreviewCount = printRows.filter(c => (printType === 'all' || c.type === printType) && (printCat === 'all' || c.category === printCat)).length

  if (loading) return <Spinner />

  return (
    <div className="page-sections">
      <PageHeader title="Cashflow" subtitle="Pantau arus keuangan bisnis kamu" icon={TrendingUp}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="show-sm"><Button variant="ghost" size="md" icon={Printer} onClick={() => setShowPrintModal(true)}>Cetak</Button></span>
            <span className="show-sm"><Button variant="outline" size="md" icon={ShoppingBag} onClick={() => setShowSaleModal(true)}>Catat Penjualan</Button></span>
            <Button icon={Plus} size="md" onClick={() => setShowModal(true)}>Transaksi</Button>
          </div>
        }
      />


      {/* Saldo Rekening Card */}
      <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', background: currentBalance >= 0 ? '#F8FAFC' : '#FEF2F2', borderColor: currentBalance >= 0 ? '#C7D2FE' : '#FECACA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: currentBalance >= 0 ? '#EEF2FF' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={20} color={currentBalance >= 0 ? '#6366F1' : '#DC2626'} />
          </div>
          <div>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 2 }}>
              Saldo Rekening Saat Ini
              {saldoAwal && <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 6 }}>· modal awal {formatRupiah(saldoAwalAmount)}</span>}
            </p>
            <p style={{ fontSize: 24, fontWeight: 800, color: currentBalance >= 0 ? '#4338CA' : '#DC2626', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {formatRupiah(currentBalance)}
            </p>
          </div>
        </div>
        <button onClick={() => { setSaldoInput(saldoAwal?.amount.toString() || ''); setShowSaldoModal(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#6366F1', background: '#EEF2FF', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#C7D2FE'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#EEF2FF'}>
          <Edit2 size={12} />
          {saldoAwal ? 'Edit Saldo Awal' : 'Set Saldo Awal'}
        </button>
      </div>

      {/* Period tabs */}
      <div className="tab-bar">
        {periods.map(p => (
          <button key={p.key} className={`tab-item ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="three-col">
        {[
          { label: 'Pemasukan', value: periodIncome, icon: ArrowUpCircle, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
          { label: 'Pengeluaran', value: periodExpense, icon: ArrowDownCircle, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
          { label: 'Selisih', value: periodIncome - periodExpense, icon: TrendingUp, color: (periodIncome - periodExpense) >= 0 ? '#4338CA' : '#DC2626', bg: (periodIncome - periodExpense) >= 0 ? '#EEF2FF' : '#FEF2F2', border: (periodIncome - periodExpense) >= 0 ? '#C7D2FE' : '#FECACA' },
        ].map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className="card" style={{ padding: '11px 12px', borderColor: c.border }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 7 }}>
                <Icon size={13} color={c.color} />
              </div>
              <p style={{ fontSize: 10, color: '#64748B', marginBottom: 2 }}>{c.label}</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: c.color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{formatRupiah(c.value)}</p>
            </div>
          )
        })}
      </div>

      {/* Transactions */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Riwayat Transaksi</h3>
          <span className="badge" style={{ background: '#F3F4F6', color: '#64748B' }}>{filtered.length} transaksi</span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#94A3B8' }}>Belum ada transaksi di periode ini</p>
          </div>
        ) : (
          <div>
            {filtered.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < filtered.length - 1 ? '1px solid #F5F3EF' : 'none', transition: 'background .15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: c.type === 'income' ? '#F0FDF4' : '#FEF2F2' }}>
                  {c.type === 'income' ? <ArrowUpCircle size={16} color="#16A34A" /> : <ArrowDownCircle size={16} color="#DC2626" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{c.category}</p>
                  {c.description && <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.description}</p>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: c.type === 'income' ? '#16A34A' : '#DC2626' }}>
                    {c.type === 'income' ? '+' : '-'}{formatRupiah(c.amount)}
                  </p>
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{new Date(c.transaction_date).toLocaleDateString('id-ID')}</p>
                </div>
                <button onClick={() => deleteCashflow(c.id)}
                  style={{ width: 28, height: 28, borderRadius: 7, background: 'none', border: 'none', color: '#E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLButtonElement).style.color = '#DC2626' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#E2E8F0' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── PRINT MODAL ── */}
      <Modal open={showPrintModal} onClose={() => setShowPrintModal(false)} title="Cetak Laporan Keuangan">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Period or custom date */}
          <div>
            <label style={lbl}>Rentang Waktu</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {(['daily', 'weekly', 'monthly', 'all'] as Period[]).map(p => {
                const labels: Record<Period, string> = { daily: 'Hari Ini', weekly: 'Minggu Ini', monthly: 'Bulan Ini', all: 'Semua' }
                const active = !useCustomDate && printPeriod === p
                return (
                  <button key={p} onClick={() => { setPrintPeriod(p); setUseCustomDate(false) }}
                    style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all .15s', background: active ? '#6366F1' : '#F8FAFC', color: active ? '#fff' : '#64748B', borderColor: active ? '#6366F1' : '#E2E8F0' }}>
                    {labels[p]}
                  </button>
                )
              })}
              <button onClick={() => setUseCustomDate(true)}
                style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all .15s', background: useCustomDate ? '#6366F1' : '#F8FAFC', color: useCustomDate ? '#fff' : '#64748B', borderColor: useCustomDate ? '#6366F1' : '#E2E8F0' }}>
                Pilih Tanggal
              </button>
            </div>
            {useCustomDate && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>Dari Tanggal</label><input className="field" type="date" value={printDateFrom} onChange={e => setPrintDateFrom(e.target.value)} /></div>
                <div><label style={lbl}>Sampai Tanggal</label><input className="field" type="date" value={printDateTo} onChange={e => setPrintDateTo(e.target.value)} /></div>
              </div>
            )}
          </div>

          {/* Type filter */}
          <div>
            <label style={lbl}>Jenis Transaksi</label>
            <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
              {[{ v: 'all', l: 'Semua' }, { v: 'income', l: '↑ Pemasukan' }, { v: 'expense', l: '↓ Pengeluaran' }].map(t => (
                <button key={t.v} onClick={() => { setPrintType(t.v); setPrintCat('all') }}
                  style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all .15s', background: printType === t.v ? '#6366F1' : '#F8FAFC', color: printType === t.v ? '#fff' : '#94A3B8' }}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <label style={lbl}>Kategori</label>
            <Select value={printCat} onChange={v => setPrintCat(v)}
              options={[{ value: 'all', label: 'Semua Kategori' }, ...(printType === 'income' ? INCOME_CATS : printType === 'expense' ? EXPENSE_CATS : ALL_CATS).map(c => ({ value: c, label: c }))]} />
          </div>

          {/* Preview summary */}
          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 16px', border: '1px solid #E2E8F0' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Preview Laporan</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
              <div><p style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Transaksi</p><p style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{printPreviewCount}</p></div>
              <div><p style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Total Masuk</p><p style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>{formatRupiah(printPreviewIn)}</p></div>
              <div><p style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Total Keluar</p><p style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>{formatRupiah(printPreviewOut)}</p></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={() => setShowPrintModal(false)} style={{ flex: 1 }}>Batal</Button>
            <Button icon={Printer} onClick={handlePrint} style={{ flex: 1 }} disabled={printPreviewCount === 0}>Cetak Sekarang</Button>
          </div>
        </div>
      </Modal>

      {/* Set Saldo Awal Modal */}
      <Modal open={showSaldoModal} onClose={() => setShowSaldoModal(false)} title={saldoAwal ? 'Edit Saldo Awal' : 'Set Saldo Awal'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#EEF2FF', borderRadius: 10, padding: '12px 14px', border: '1px solid #C7D2FE' }}>
            <p style={{ fontSize: 13, color: '#3730A3', fontWeight: 600, marginBottom: 4 }}>Apa itu Saldo Awal?</p>
            <p style={{ fontSize: 12, color: '#4338CA', lineHeight: 1.5 }}>Jumlah uang yang ada di rekening/kas kamu sebelum mulai mencatat di aplikasi ini.</p>
          </div>
          <div>
            <label style={lbl}>Jumlah Saldo Awal (Rp) *</label>
            <NumInput placeholder="500.000" value={saldoInput} onChange={setSaldoInput} autoFocus />
          </div>
          {saldoInput && (
            <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '10px 14px', border: '1px solid #BBF7D0', textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Saldo rekening setelah set</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#16A34A' }}>{formatRupiah(parseFloat(saldoInput || '0') + allIncome - allExpense)}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={() => setShowSaldoModal(false)} style={{ flex: 1 }}>Batal</Button>
            <Button onClick={saveSaldoAwal} loading={saving} style={{ flex: 1 }}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Add Cashflow Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Tambah Transaksi">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            {(['income', 'expense'] as const).map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t, category: '' }))}
                style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all .15s', background: form.type === t ? (t === 'income' ? '#16A34A' : '#DC2626') : '#F8FAFC', color: form.type === t ? '#fff' : '#94A3B8' }}>
                {t === 'income' ? '↑ Pemasukan' : '↓ Pengeluaran'}
              </button>
            ))}
          </div>
          <div>
            <label style={lbl}>Kategori *</label>
            <Select value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))}
              placeholder="-- Pilih Kategori --"
              options={[{ value: '', label: '-- Pilih Kategori --' }, ...(form.type === 'income' ? INCOME_CATS : EXPENSE_CATS).map(c => ({ value: c, label: c }))]} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Jumlah (Rp) *</label><NumInput placeholder="0" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} /></div>
            <div><label style={lbl}>Tanggal</label><input className="field" type="date" value={form.transaction_date} onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} /></div>
          </div>
          <div><label style={lbl}>Keterangan</label><input className="field" placeholder="Opsional..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Batal</Button>
            <Button onClick={saveCashflow} loading={saving} style={{ flex: 1 }}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Sale Modal */}
      <Modal open={showSaleModal} onClose={() => setShowSaleModal(false)} title="Catat Penjualan">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={lbl}>Varian yang Dijual *</label>
            <Select value={saleForm.variant_id}
              onChange={v => { const found = variants.find(x => x.id === v); setSaleForm(f => ({ ...f, variant_id: v, unit_price: found?.selling_price.toString() || '' })) }}
              placeholder="-- Pilih Varian --"
              options={[{ value: '', label: '-- Pilih Varian --' }, ...variants.map(v => ({ value: v.id, label: `${v.name} — stok: ${v.stock} pcs` }))]} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Jumlah (pcs) *</label><input className="field" type="number" placeholder="1" value={saleForm.quantity} onChange={e => setSaleForm(f => ({ ...f, quantity: e.target.value }))} /></div>
            <div><label style={lbl}>Harga/pcs (Rp) *</label><NumInput placeholder="0" value={saleForm.unit_price} onChange={v => setSaleForm(f => ({ ...f, unit_price: v }))} /></div>
          </div>
          {saleForm.quantity && saleForm.unit_price && (
            <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '12px 16px', textAlign: 'center', border: '1px solid #BBF7D0' }}>
              <p style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>Total Penjualan</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#16A34A' }}>{formatRupiah(parseInt(saleForm.quantity || '0') * parseFloat(saleForm.unit_price || '0'))}</p>
            </div>
          )}
          <div><label style={lbl}>Catatan</label><input className="field" placeholder="Opsional..." value={saleForm.notes} onChange={e => setSaleForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={() => setShowSaleModal(false)} style={{ flex: 1 }}>Batal</Button>
            <Button onClick={saveSale} loading={saving} style={{ flex: 1 }}>Simpan Penjualan</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }

function Spinner() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}><div style={{ width: 28, height: 28, border: '2.5px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /></div>
}
