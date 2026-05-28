'use client'
import { useState } from 'react'
import { Plus, Pencil, PackagePlus, Search, Download } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { exportCSV } from '@/lib/csv'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import NumInput from '@/components/ui/NumInput'
import { SwipeableRow } from '@/components/ui/SwipeableRow'
import type { RawMaterial } from '@/types'

interface MaterialListProps {
  materials: RawMaterial[]
  loading: boolean
  saving: boolean
  onCreate: (p: { name: string; unit: string; stock: number; min_stock: number }) => Promise<void>
  onUpdate: (id: string, p: { name: string; unit: string; stock: number; min_stock: number }) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onRestock: (p: { materialId: string; qty: number; totalCost: number; recordCashflow: boolean }) => Promise<void>
}

const UNITS = ['ml', 'gram', 'pcs', 'liter', 'kg']

export function MaterialList({ materials, loading, saving, onCreate, onUpdate, onRemove, onRestock }: MaterialListProps) {
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState<RawMaterial | null>(null)
  const [showRestock, setShowRestock] = useState<RawMaterial | null>(null)
  const [form, setForm] = useState({ name: '', unit: 'ml', stock: '', min_stock: '' })
  const [restockForm, setRestockForm] = useState({ qty: '', total_cost: '', catat: true })

  const filtered = materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))

  const handleExport = () => {
    exportCSV(materials as unknown as Record<string, unknown>[], [
      { key: 'name', label: 'Nama Bahan' },
      { key: 'unit', label: 'Satuan' },
      { key: 'stock', label: 'Stok' },
      { key: 'min_stock', label: 'Stok Min' },
      { key: 'cost_per_unit', label: 'Harga/Satuan' },
    ], 'bahan_baku')
  }

  const parseInput = (v: string) => parseFloat(v.replace(/\./g, '')) || 0

  if (loading) return <p className="empty">Memuat data...</p>

  return (
    <div>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="search-box" style={{ flex: 1, minWidth: 200, maxWidth: 480 }}>
          <Search size={16} color="#94A3B8" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari bahan..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: '100%' }} />
        </div>
        <div className="flex-row">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>CSV</Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => { setForm({ name: '', unit: 'ml', stock: '', min_stock: '' }); setShowAdd(true) }}>
            Tambah Bahan
          </Button>
        </div>
      </div>

      <div className="mat-grid">
        {filtered.map(m => {
          const pct = m.stock > 0 && m.min_stock > 0 ? Math.min(100, (m.stock / Math.max(m.stock, m.min_stock * 2)) * 100) : 50
          const isCritical = m.stock <= m.min_stock
          return (
            <SwipeableRow key={m.id} onDelete={() => onRemove(m.id)}>
            <div className="card" style={{ position: 'relative', borderColor: isCritical ? '#FCA5A5' : undefined, background: isCritical ? '#FFF5F5' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{m.name}</h4>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>{m.unit} &middot; Rp{formatNumber(m.cost_per_unit)}/{m.unit}</p>
                </div>
                {isCritical && <p style={{ fontSize: 11, color: '#DC2626', fontWeight: 700, margin: 0 }}>KRITIS</p>}
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>Stok: <strong>{formatNumber(m.stock)}</strong></span>
                  <span style={{ color: '#94A3B8' }}>Min: {formatNumber(m.min_stock)}</span>
                </div>
                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: isCritical ? '#EF4444' : '#10B981', borderRadius: 3, transition: 'width .3s' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
                <Button variant="soft" size="sm" icon={PackagePlus} onClick={() => { setShowRestock(m); setRestockForm({ qty: '', total_cost: '', catat: true }) }}>
                  Restock
                </Button>
                <Button variant="soft" size="sm" icon={Pencil} onClick={() => { setShowEdit(m); setForm({ name: m.name, unit: m.unit, stock: String(m.stock), min_stock: String(m.min_stock) }) }}>
                  Edit
                </Button>
              </div>
            </div>
            </SwipeableRow>
          )
        })}
        {filtered.length === 0 && <p style={{ padding: 20, textAlign: 'center', color: '#94A3B8', gridColumn: '1 / -1' }}>Tidak ada bahan.</p>}
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} title="Tambah Bahan" size="sm" onClose={() => setShowAdd(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Nama Bahan</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="contoh: Bibit Parfum"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Satuan</label>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {UNITS.map(u => (
                <button key={u} onClick={() => setForm({ ...form, unit: u })}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid', borderColor: form.unit === u ? '#6366F1' : '#E2E8F0', background: form.unit === u ? '#EEF2FF' : '#fff', color: form.unit === u ? '#4338CA' : '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Stok Awal</label>
            <NumInput value={form.stock} onChange={v => setForm({ ...form, stock: v })} placeholder="0" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Stok Minimum</label>
            <NumInput value={form.min_stock} onChange={v => setForm({ ...form, min_stock: v })} placeholder="0" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={async () => {
              await onCreate({ name: form.name, unit: form.unit, stock: parseInput(form.stock), min_stock: parseInput(form.min_stock) })
              setShowAdd(false)
            }}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!showEdit} title="Edit Bahan" size="sm" onClose={() => setShowEdit(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Nama</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Satuan</label>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {UNITS.map(u => (
                <button key={u} onClick={() => setForm({ ...form, unit: u })}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid', borderColor: form.unit === u ? '#6366F1' : '#E2E8F0', background: form.unit === u ? '#EEF2FF' : '#fff', color: form.unit === u ? '#4338CA' : '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Stok</label>
            <NumInput value={form.stock} onChange={v => setForm({ ...form, stock: v })} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Stok Minimum</label>
            <NumInput value={form.min_stock} onChange={v => setForm({ ...form, min_stock: v })} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowEdit(null)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={async () => {
              await onUpdate(showEdit!.id, { name: form.name, unit: form.unit, stock: parseInput(form.stock), min_stock: parseInput(form.min_stock) })
              setShowEdit(null)
            }}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Restock Modal */}
      <Modal open={!!showRestock} title={`Restock ${showRestock?.name}`} size="sm" onClose={() => setShowRestock(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#64748B' }}>Stok saat ini: <strong>{formatNumber(showRestock?.stock ?? 0)} {showRestock?.unit}</strong></p>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Qty Beli ({showRestock?.unit})</label>
            <NumInput value={restockForm.qty} onChange={v => setRestockForm({ ...restockForm, qty: v })} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Total Harga Beli (Rp)</label>
            <NumInput value={restockForm.total_cost} onChange={v => setRestockForm({ ...restockForm, total_cost: v })} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={restockForm.catat} onChange={e => setRestockForm({ ...restockForm, catat: e.target.checked })}
              style={{ width: 16, height: 16 }} />
            Catat ke Cashflow
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowRestock(null)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={async () => {
              await onRestock({ materialId: showRestock!.id, qty: parseInput(restockForm.qty), totalCost: parseInput(restockForm.total_cost), recordCashflow: restockForm.catat })
              setShowRestock(null)
            }}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
