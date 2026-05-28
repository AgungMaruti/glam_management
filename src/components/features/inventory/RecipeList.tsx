'use client'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import NumInput from '@/components/ui/NumInput'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { Recipe, RawMaterial, Variant } from '@/types'

interface RecipeListProps {
  data: (Variant & { recipes: (Recipe & { raw_material: RawMaterial })[] })[]
  materials: RawMaterial[]
  loading: boolean
  saving: boolean
  onCreate: (p: { variant_id: string; raw_material_id: string; quantity_needed: number }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export function RecipeList({ data, materials, loading, saving, onCreate, onRemove }: RecipeListProps) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ variant_id: '', raw_material_id: '', quantity_needed: '' })
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const variantOptions = data.map(v => ({ value: v.id, label: `${v.product?.name || ''} - ${v.name}` }))
  const materialOptions = materials.map(m => ({ value: m.id, label: `${m.name} (${m.unit})` }))

  if (loading) return <p className="empty">Memuat data...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => { setForm({ variant_id: '', raw_material_id: '', quantity_needed: '' }); setShowModal(true) }}>
          Tambah Bahan ke Resep
        </Button>
      </div>

      {data.length === 0 ? (
        <p className="empty">Belum ada resep. Buat varian dulu di Produk & Varian.</p>
      ) : (
        data.map(v => (
          <div key={v.id} className="card" style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
              {v.product?.name} — {v.name} ({formatNumber(v.size_ml)} ml)
            </h4>
            {(!v.recipes || v.recipes.length === 0) ? (
              <p style={{ fontSize: 13, color: '#94A3B8' }}>Belum ada bahan dalam resep ini.</p>
            ) : (
              <div className="table-resp">
                <table>
                  <thead>
                    <tr>
                      <th>Bahan</th>
                      <th>Qty/Botol</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {v.recipes.map(r => (
                      <tr key={r.id}>
                        <td>{r.raw_material?.name}</td>
                        <td>{formatNumber(r.quantity_needed)} {r.raw_material?.unit}</td>
                        <td>
                          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteId(r.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}

      <Modal open={showModal} title="Tambah Bahan ke Resep" size="sm" onClose={() => setShowModal(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Varian</label>
            <Select options={variantOptions} value={form.variant_id} onChange={v => setForm({ ...form, variant_id: v })} placeholder="Pilih varian" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Bahan Baku</label>
            <Select options={materialOptions} value={form.raw_material_id} onChange={v => setForm({ ...form, raw_material_id: v })} placeholder="Pilih bahan" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Quantity per Botol</label>
            <NumInput value={form.quantity_needed} onChange={v => setForm({ ...form, quantity_needed: v })} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={async () => {
              const qty = parseFloat(form.quantity_needed.replace(/\./g, '')) || 0
              await onCreate({ variant_id: form.variant_id, raw_material_id: form.raw_material_id, quantity_needed: qty })
              setShowModal(false)
            }}>Simpan</Button>
          </div>
        </div>
      </Modal>
      <ConfirmModal
        open={!!deleteId}
        title="Konfirmasi Hapus"
        message="Bahan resep yang dihapus tidak bisa dikembalikan. Lanjutkan?"
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) onRemove(deleteId); setDeleteId(null) }}
      />
    </div>
  )
}
