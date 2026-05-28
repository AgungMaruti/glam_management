'use client'
import { useState } from 'react'
import { Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatRupiah, formatNumber } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import NumInput from '@/components/ui/NumInput'
import type { Production, Variant, Recipe, RawMaterial } from '@/types'

interface ProductionListProps {
  productions: (Production & { variant: Variant })[]
  page: number
  total: number
  limit: number
  loading: boolean
  saving: boolean
  onPageChange: (page: number) => void
  onRun: (p: { variantId: string; quantity: number; notes?: string }) => Promise<void>
  variants: (Variant & { recipes: (Recipe & { raw_material: RawMaterial })[] })[]
}

export function ProductionList({ productions, page, total, limit, loading, saving, onPageChange, onRun, variants }: ProductionListProps) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ variant_id: '', quantity: '', notes: '' })
  const [preview, setPreview] = useState<{ name: string; needed: number; available: number; ok: boolean }[]>([])

  const variantOptions = variants.map(v => ({ value: v.id, label: `${v.product?.name || ''} - ${v.name}` }))

  const handlePreview = () => {
    const sel = variants.find(v => v.id === form.variant_id)
    if (!sel || !sel.recipes) return setPreview([])
    const qty = parseInt(form.quantity.replace(/\D/g, '')) || 0
    setPreview(sel.recipes.map(r => ({
      name: r.raw_material?.name || '?',
      needed: r.quantity_needed * qty,
      available: r.raw_material?.stock || 0,
      ok: (r.raw_material?.stock || 0) >= r.quantity_needed * qty,
    })))
  }

  const totalPages = Math.ceil(total / limit)

  if (loading) return <p className="empty">Memuat data...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Riwayat Produksi</h3>
        <Button variant="primary" size="sm" icon={Zap} onClick={() => { setForm({ variant_id: '', quantity: '', notes: '' }); setPreview([]); setShowModal(true) }}>
          Jalankan Produksi
        </Button>
      </div>

      {productions.length === 0 ? (
        <p className="empty">Belum ada riwayat produksi.</p>
      ) : (
        <>
          <div className="table-resp">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Varian</th>
                  <th>Qty</th>
                  <th>Biaya</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {productions.map(p => (
                  <tr key={p.id}>
                    <td>{new Date(p.produced_at).toLocaleDateString('id-ID')}</td>
                    <td>{p.variant?.name}</td>
                    <td>{formatNumber(p.quantity)} pcs</td>
                    <td>{formatRupiah(p.total_cost)}</td>
                    <td>{p.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
              <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => onPageChange(page - 1)} disabled={page <= 1} />
              <span style={{ fontSize: 13, color: '#64748B' }}>Hal {page} / {totalPages}</span>
              <Button variant="ghost" size="sm" icon={ChevronRight} onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} />
            </div>
          )}
        </>
      )}

      <Modal open={showModal} title="Jalankan Produksi" size="md" onClose={() => setShowModal(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Varian</label>
            <Select options={variantOptions} value={form.variant_id} onChange={v => setForm({ ...form, variant_id: v })} placeholder="Pilih varian" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Jumlah Produksi (pcs)</label>
            <NumInput value={form.quantity} onChange={v => setForm({ ...form, quantity: v })} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Catatan (opsional)</label>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="contoh: batch minggu ini"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
          </div>

          <Button variant="outline" size="sm" onClick={handlePreview}>Cek Kebutuhan Bahan</Button>

          {preview.length > 0 && (
            <div className="card" style={{ background: '#F8FAFC' }}>
              <h5 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Preview Kebutuhan</h5>
              <div className="table-resp"><table style={{ minWidth: 'auto', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ textAlign: 'left', padding: 6, fontWeight: 600 }}>Bahan</th>
                    <th style={{ textAlign: 'left', padding: 6, fontWeight: 600 }}>Dibutuhkan</th>
                    <th style={{ textAlign: 'left', padding: 6, fontWeight: 600 }}>Tersedia</th>
                    <th style={{ textAlign: 'left', padding: 6, fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: 6 }}>{p.name}</td>
                      <td style={{ padding: 6 }}>{formatNumber(p.needed)}</td>
                      <td style={{ padding: 6 }}>{formatNumber(p.available)}</td>
                      <td style={{ padding: 6, color: p.ok ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {p.ok ? 'OK Cukup' : 'X Kurang'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={async () => {
              const qty = parseInt(form.quantity.replace(/\D/g, '')) || 0
              await onRun({ variantId: form.variant_id, quantity: qty, notes: form.notes || undefined })
              setShowModal(false)
            }}>Jalankan Produksi</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
