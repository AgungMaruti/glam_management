'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, Printer, Download, Wallet } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { exportCSV } from '@/lib/csv'
import { cashflowDb } from '@/lib/db'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import NumInput from '@/components/ui/NumInput'
import Select from '@/components/ui/Select'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { Cashflow, InitialBalance } from '@/types'

interface TransactionListProps {
  data: Cashflow[]
  period: 'daily' | 'weekly' | 'monthly' | 'all'
  page: number
  total: number
  limit: number
  loading: boolean
  saving: boolean
  balance: InitialBalance | null
  onPeriodChange: (p: 'daily' | 'weekly' | 'monthly' | 'all') => void
  onPageChange: (p: number) => void
  onAdd: (p: { type: 'income' | 'expense'; category: string; amount: number; description?: string; date?: string }) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onSetBalance: (amount: number) => Promise<void>
}

const PERIODS = [
  { value: 'daily' as const, label: 'Hari Ini' },
  { value: 'weekly' as const, label: 'Minggu Ini' },
  { value: 'monthly' as const, label: 'Bulan Ini' },
  { value: 'all' as const, label: 'Semua' },
]
const INCOME_CATS = ['Penjualan', 'Reseller', 'Dropship', 'Lainnya']
const EXPENSE_CATS = ['Produksi', 'Gaji Karyawan', 'Marketing', 'Packaging', 'Ongkir', 'Operasional', 'Lainnya']

export function TransactionList(props: TransactionListProps) {
  const { data, period, page, total, limit, loading, saving, balance } = props
  const [showAdd, setShowAdd] = useState(false)
  const [showBalance, setShowBalance] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ type: 'income' as 'income' | 'expense', category: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) })
  const [balanceForm, setBalanceForm] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const parseInput = (v: string) => parseFloat(v.replace(/\./g, '')) || 0
  const totalPages = Math.ceil(total / limit)
  const incomeTotal = data.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenseTotal = data.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const selisih = incomeTotal - expenseTotal

  const [allTimeNet, setAllTimeNet] = useState(0)
  useEffect(() => {
    cashflowDb.getAll({ period: 'all', limit: 1000 }).then(r => {
      const inc = r.data.filter(t => t.type === 'income').reduce((s: number, t: Cashflow) => s + t.amount, 0)
      const exp = r.data.filter(t => t.type === 'expense').reduce((s: number, t: Cashflow) => s + t.amount, 0)
      setAllTimeNet(inc - exp)
    }).catch(() => {})
  }, [data.length])

  const filtered = data.filter(t =>
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  )

  const cats = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS

  const handlePrint = () => {
    const filterLabel = PERIODS.find(p => p.value === period)?.label || 'Semua'
    const printWin = window.open('', '_blank')
    if (!printWin) return
    const rows = filtered.map(t => `
      <tr><td>${new Date(t.transaction_date).toLocaleDateString('id-ID')}</td>
      <td>${t.category}</td><td>${t.description || '-'}</td>
      <td style="color:${t.type === 'income' ? '#10B981' : '#EF4444'}">${t.type === 'income' ? '+' : '-'}${formatRupiah(t.amount)}</td></tr>
    `).join('')
    printWin.document.write(`
      <html><head><title>Laporan Cashflow</title><style>
        body{font-family:sans-serif;padding:30px} h1{font-size:20px} table{width:100%;border-collapse:collapse;margin-top:16px}
        th,td{border-bottom:1px solid #ddd;padding:8px 12px;text-align:left;font-size:13px}
      </style></head><body>
        <h1>Laporan Cashflow - ${filterLabel}</h1>
        <p>Pemasukan: ${formatRupiah(incomeTotal)} | Pengeluaran: ${formatRupiah(expenseTotal)} | Selisih: ${formatRupiah(selisih)}</p>
        <table><thead><tr><th>Tanggal</th><th>Kategori</th><th>Deskripsi</th><th>Nominal</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>
    `)
    printWin.print()
  }

  const handleExport = () => {
    exportCSV(filtered as unknown as Record<string, unknown>[], [
      { key: 'type', label: 'Tipe' }, { key: 'category', label: 'Kategori' },
      { key: 'amount', label: 'Nominal' }, { key: 'description', label: 'Deskripsi' },
      { key: 'transaction_date', label: 'Tanggal' },
    ], 'cashflow')
  }

  if (loading) return <p className="empty">Memuat data...</p>

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wallet size={20} color="#4338CA" />
            <div>
              <p style={{ fontSize: 12, color: '#6366F1', margin: 0 }}>Saldo Rekening</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#4338CA', margin: 0 }}>{formatRupiah((balance?.amount || 0) + allTimeNet)}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setBalanceForm(String(balance?.amount || '')); setShowBalance(true) }}>
            {balance ? 'Edit Saldo Awal' : 'Set Saldo Awal'}
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => props.onPeriodChange(p.value)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              borderColor: period === p.value ? '#6366F1' : '#E2E8F0',
              background: period === p.value ? '#EEF2FF' : '#fff',
              color: period === p.value ? '#4338CA' : '#64748B',
            }}>{p.label}</button>
        ))}
      </div>

      <div className="three-col" style={{ marginBottom: 16 }}>
        <div className="card"><p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Pemasukan</p><p style={{ fontSize: 16, fontWeight: 700, color: '#10B981', margin: '4px 0 0' }}>{formatRupiah(incomeTotal)}</p></div>
        <div className="card"><p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Pengeluaran</p><p style={{ fontSize: 16, fontWeight: 700, color: '#EF4444', margin: '4px 0 0' }}>{formatRupiah(expenseTotal)}</p></div>
        <div className="card"><p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Selisih</p><p style={{ fontSize: 16, fontWeight: 700, color: selisih >= 0 ? '#10B981' : '#EF4444', margin: '4px 0 0' }}>{formatRupiah(selisih)}</p></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div className="search-box" style={{ width: 240 }}>
          <Search size={16} color="#94A3B8" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari transaksi..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>Cetak</Button>
          <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>CSV</Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => { setForm({ type: 'income', category: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) }); setShowAdd(true) }}>
            Tambah Transaksi
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">Tidak ada transaksi.</p>
      ) : (
        <div>
          {filtered.map(t => (
            <div key={t.id} className="tx-row">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: t.type === 'income' ? '#ECFDF5' : '#FEF2F2', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: t.type === 'income' ? '#059669' : '#DC2626' }}>
                    {t.type === 'income' ? 'IN' : 'OUT'}
                  </span>
                  <strong>{t.category}</strong>
                </div>
                {t.description && <p style={{ margin: '4px 0 0', color: '#94A3B8' }}>{t.description}</p>}
                <p style={{ margin: '2px 0 0', color: '#94A3B8', fontSize: 11 }}>{new Date(t.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: t.type === 'income' ? '#10B981' : '#EF4444' }}>
                  {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                </span>
                <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteId(t.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
          <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => props.onPageChange(page - 1)} disabled={page <= 1} />
          <span style={{ fontSize: 13, color: '#64748B' }}>Hal {page} / {totalPages}</span>
          <Button variant="ghost" size="sm" icon={ChevronRight} onClick={() => props.onPageChange(page + 1)} disabled={page >= totalPages} />
        </div>
      )}

      <Modal open={showAdd} title="Tambah Transaksi" size="sm" onClose={() => setShowAdd(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setForm({ ...form, type: 'income', category: '' })}
              style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid', borderColor: form.type === 'income' ? '#10B981' : '#E2E8F0', background: form.type === 'income' ? '#ECFDF5' : '#fff', color: form.type === 'income' ? '#059669' : '#64748B', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Pemasukan
            </button>
            <button onClick={() => setForm({ ...form, type: 'expense', category: '' })}
              style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid', borderColor: form.type === 'expense' ? '#EF4444' : '#E2E8F0', background: form.type === 'expense' ? '#FEF2F2' : '#fff', color: form.type === 'expense' ? '#DC2626' : '#64748B', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Pengeluaran
            </button>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Kategori</label>
            <Select options={cats.map(c => ({ value: c, label: c }))} value={form.category} onChange={v => setForm({ ...form, category: v })} placeholder="Pilih kategori" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Nominal (Rp)</label>
            <NumInput value={form.amount} onChange={v => setForm({ ...form, amount: v })} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Deskripsi (opsional)</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Tanggal</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={async () => {
              await props.onAdd({ type: form.type, category: form.category, amount: parseInput(form.amount), description: form.description || undefined, date: form.date })
              setShowAdd(false)
            }}>Simpan</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showBalance} title="Set Saldo Awal" size="sm" onClose={() => setShowBalance(false)}>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
          Total uang yang ada di rekening/kas kamu sekarang (sebelum pakai aplikasi). Input sekali saja.
        </p>
        <NumInput value={balanceForm} onChange={setBalanceForm} placeholder="Saldo awal" />
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setShowBalance(false)}>Batal</Button>
          <Button variant="primary" loading={false} onClick={async () => {
            await props.onSetBalance(parseFloat(balanceForm.replace(/\D/g, '')) || 0)
            setShowBalance(false)
          }}>Simpan</Button>
        </div>
      </Modal>
      <ConfirmModal
        open={!!deleteId}
        title="Konfirmasi Hapus"
        message="Transaksi yang dihapus tidak bisa dikembalikan. Lanjutkan?"
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) props.onRemove(deleteId); setDeleteId(null) }}
      />
    </div>
  )
}
