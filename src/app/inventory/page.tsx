'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Boxes, Plus, Trash2, FlaskConical, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils'
import { RawMaterial, Variant, Recipe } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

type Tab = 'materials' | 'recipe' | 'production'

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('materials')
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [variants, setVariants] = useState<(Variant & { recipes: (Recipe & { raw_material: RawMaterial })[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showMatModal, setShowMatModal] = useState(false)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [showProdModal, setShowProdModal] = useState(false)
  const [matForm, setMatForm] = useState({ name: '', unit: 'ml', stock: '', min_stock: '', total_cost: '', cost_per_unit: '' })
  const [recipeForm, setRecipeForm] = useState({ variant_id: '', raw_material_id: '', quantity_needed: '' })
  const [prodForm, setProdForm] = useState({ variant_id: '', quantity: '', notes: '' })
  const [preview, setPreview] = useState<{ name: string; needed: number; available: number; ok: boolean }[]>([])

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (prodForm.variant_id && prodForm.quantity) {
      const v = variants.find(v => v.id === prodForm.variant_id)
      if (v) {
        const qty = parseInt(prodForm.quantity) || 0
        setPreview(v.recipes.map(r => ({ name: r.raw_material?.name || '', needed: r.quantity_needed * qty, available: r.raw_material?.stock || 0, ok: (r.raw_material?.stock || 0) >= r.quantity_needed * qty })))
      }
    } else setPreview([])
  }, [prodForm.variant_id, prodForm.quantity, variants])

  async function load() {
    const [mRes, vRes] = await Promise.all([
      supabase.from('raw_materials').select('*').order('name'),
      supabase.from('variants').select('*, recipes(*, raw_material:raw_materials(*))').order('name'),
    ])
    setMaterials(mRes.data || [])
    setVariants(vRes.data || [])
    setLoading(false)
  }

  async function saveMaterial() {
    if (!matForm.name) return
    setSaving(true)
    await supabase.from('raw_materials').insert({ name: matForm.name, unit: matForm.unit, stock: parseFloat(matForm.stock) || 0, min_stock: parseFloat(matForm.min_stock) || 0, cost_per_unit: parseFloat(matForm.cost_per_unit) || 0 })
    setMatForm({ name: '', unit: 'ml', stock: '', min_stock: '', total_cost: '', cost_per_unit: '' })
    setShowMatModal(false); setSaving(false); load()
  }

  async function saveRecipe() {
    if (!recipeForm.variant_id || !recipeForm.raw_material_id || !recipeForm.quantity_needed) return
    setSaving(true)
    await supabase.from('recipes').insert({ variant_id: recipeForm.variant_id, raw_material_id: recipeForm.raw_material_id, quantity_needed: parseFloat(recipeForm.quantity_needed) })
    setRecipeForm({ variant_id: '', raw_material_id: '', quantity_needed: '' })
    setShowRecipeModal(false); setSaving(false); load()
  }

  async function runProduction() {
    if (!prodForm.variant_id || !prodForm.quantity) return
    if (preview.some(p => !p.ok)) { alert('Stok bahan baku tidak mencukupi!'); return }
    setSaving(true)
    const qty = parseInt(prodForm.quantity)
    const variant = variants.find(v => v.id === prodForm.variant_id)!
    for (const r of variant.recipes) {
      await supabase.from('raw_materials').update({ stock: (r.raw_material?.stock || 0) - r.quantity_needed * qty }).eq('id', r.raw_material_id)
    }
    await supabase.from('variants').update({ stock: (variant.stock || 0) + qty }).eq('id', prodForm.variant_id)
    await supabase.from('productions').insert({ variant_id: prodForm.variant_id, quantity: qty, notes: prodForm.notes })
    const cost = variant.recipes.reduce((sum, r) => sum + (r.raw_material?.cost_per_unit || 0) * r.quantity_needed * qty, 0)
    if (cost > 0) await supabase.from('cashflow').insert({ type: 'expense', category: 'Produksi', amount: cost, description: `Produksi ${qty} pcs ${variant.name}`, transaction_date: new Date().toISOString() })
    setProdForm({ variant_id: '', quantity: '', notes: '' })
    setShowProdModal(false); setSaving(false); load()
  }

  async function deleteMaterial(id: string) {
    if (!confirm('Hapus bahan baku ini?')) return
    await supabase.from('raw_materials').delete().eq('id', id); load()
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'materials', label: 'Bahan Baku', icon: Boxes },
    { key: 'recipe', label: 'Resep / BOM', icon: FlaskConical },
    { key: 'production', label: 'Produksi', icon: Zap },
  ]

  if (loading) return <Spinner />

  return (
    <div className="page-sections">
      <PageHeader title="Inventori" subtitle="Kelola bahan baku, resep, dan produksi batch" icon={Boxes}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {tab === 'materials' && <Button icon={Plus} size="sm" onClick={() => setShowMatModal(true)}>Bahan Baku</Button>}
            {tab === 'recipe' && <Button icon={Plus} size="sm" onClick={() => setShowRecipeModal(true)}>Tambah Resep</Button>}
            {tab === 'production' && <Button icon={Zap} size="sm" onClick={() => setShowProdModal(true)}>Produksi</Button>}
          </div>
        }
      />

      {/* Tabs */}
      <div className="tab-bar">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} className={`tab-item ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              <Icon size={14} />
              <span className="show-sm">{t.label}</span>
            </button>
          )
        })}
      </div>

      <div>
        {tab === 'materials' && (
          <div>
            {materials.length === 0 ? (
              <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
                <Boxes size={28} color="#D1D5DB" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: '#9CA3AF', fontSize: 14 }}>Belum ada bahan baku</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {materials.map(m => {
                  const critical = m.stock <= m.min_stock
                  const pct = Math.min((m.stock / Math.max(m.min_stock * 3, 1)) * 100, 100)
                  return (
                    <div key={m.id} className="card" style={{ padding: '16px 18px', ...(critical ? { borderColor: '#FCA5A5' } : {}) }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{m.name}</p>
                          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{formatRupiah(m.cost_per_unit)}/{m.unit}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {critical && <span className="badge" style={{ background: '#FEE2E2', color: '#B91C1C' }}>Kritis</span>}
                          <button onClick={() => deleteMaterial(m.id)}
                            style={{ width: 28, height: 28, borderRadius: 7, background: 'none', border: 'none', color: '#D1D5DB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLButtonElement).style.color = '#DC2626' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#D1D5DB' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: 28, fontWeight: 800, color: critical ? '#DC2626' : '#111827', letterSpacing: '-0.03em', marginBottom: 2 }}>{m.stock}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>{m.unit} tersisa</p>
                      <div style={{ height: 5, borderRadius: 99, background: '#F3F4F6', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, background: critical ? '#EF4444' : '#6366F1', width: `${pct}%`, transition: 'width .3s' }} />
                      </div>
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Min: {m.min_stock} {m.unit}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'recipe' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {variants.length === 0 ? (
                <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <p style={{ color: '#9CA3AF', fontSize: 14 }}>Tambah produk & varian terlebih dahulu</p>
                </div>
              ) : variants.map(v => (
                <div key={v.id} className="card" style={{ padding: '14px 18px' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 10 }}>{v.name}</p>
                  {v.recipes.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {v.recipes.map(r => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: '#F9F8F4' }}>
                          <span style={{ fontSize: 13, color: '#374151' }}>{r.raw_material?.name}</span>
                          <span className="badge" style={{ background: '#EEF2FF', color: '#4338CA' }}>{r.quantity_needed} {r.raw_material?.unit}/botol</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: '#9CA3AF' }}>Belum ada resep</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'production' && (
          <div>
            <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Zap size={24} color="#6366F1" />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Produksi Batch</p>
              <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Stok bahan baku berkurang otomatis sesuai resep</p>
              <Button icon={Zap} onClick={() => setShowProdModal(true)}>Mulai Produksi</Button>
            </div>
          </div>
        )}
      </div>

      {/* Material Modal */}
      <Modal open={showMatModal} onClose={() => setShowMatModal(false)} title="Tambah Bahan Baku">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={lbl}>Nama Bahan *</label><input className="field" placeholder="Bibit Parfum" value={matForm.name} onChange={e => setMatForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Satuan</label>
              <select className="field" value={matForm.unit} onChange={e => setMatForm(f => ({ ...f, unit: e.target.value }))}>
                {['ml', 'gram', 'pcs', 'liter', 'kg'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Stok Awal ({matForm.unit})</label><input className="field" type="number" placeholder="0" value={matForm.stock} onChange={e => {
              const stock = e.target.value
              const cpu = matForm.total_cost && stock ? (parseFloat(matForm.total_cost) / parseFloat(stock)).toFixed(2) : matForm.cost_per_unit
              setMatForm(f => ({ ...f, stock, cost_per_unit: cpu }))
            }} /></div>
          </div>

          {/* Harga: bisa input total+qty atau langsung per satuan */}
          <div style={{ background: '#F9F8F4', borderRadius: 10, padding: '12px 14px', border: '1.5px solid #E8E5E0' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Harga Bahan</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={lbl}>Harga Beli Total (Rp)</label>
                <input className="field" type="number" placeholder="17000" value={matForm.total_cost}
                  onChange={e => {
                    const total = e.target.value
                    const cpu = total && matForm.stock ? (parseFloat(total) / parseFloat(matForm.stock)).toFixed(2) : ''
                    setMatForm(f => ({ ...f, total_cost: total, cost_per_unit: cpu }))
                  }} />
              </div>
              <div>
                <label style={lbl}>Dapat ({matForm.unit})</label>
                <input className="field" type="number" placeholder="100" value={matForm.stock}
                  onChange={e => {
                    const stock = e.target.value
                    const cpu = matForm.total_cost && stock ? (parseFloat(matForm.total_cost) / parseFloat(stock)).toFixed(2) : ''
                    setMatForm(f => ({ ...f, stock, cost_per_unit: cpu }))
                  }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 1, background: '#E8E5E0' }} />
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>atau langsung input</span>
              <div style={{ flex: 1, height: 1, background: '#E8E5E0' }} />
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={lbl}>Harga per {matForm.unit} (Rp)</label>
              <input className="field" type="number" placeholder="170"
                value={matForm.cost_per_unit}
                onChange={e => setMatForm(f => ({ ...f, cost_per_unit: e.target.value, total_cost: '' }))}
                style={matForm.total_cost && matForm.stock ? { background: '#EEF2FF', borderColor: '#6366F1', fontWeight: 700 } : {}}
              />
              {matForm.total_cost && matForm.stock && (
                <p style={{ fontSize: 11, color: '#6366F1', marginTop: 4 }}>
                  ✓ Auto: Rp {matForm.total_cost} ÷ {matForm.stock} {matForm.unit} = <strong>Rp {matForm.cost_per_unit}/{matForm.unit}</strong>
                </p>
              )}
            </div>
          </div>

          <div><label style={lbl}>Stok Min — alert kalau di bawah ini ({matForm.unit})</label><input className="field" type="number" placeholder="0" value={matForm.min_stock} onChange={e => setMatForm(f => ({ ...f, min_stock: e.target.value }))} /></div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={() => setShowMatModal(false)} style={{ flex: 1 }}>Batal</Button>
            <Button onClick={saveMaterial} loading={saving} style={{ flex: 1 }}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Recipe Modal */}
      <Modal open={showRecipeModal} onClose={() => setShowRecipeModal(false)} title="Tambah Resep / BOM">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={lbl}>Varian *</label>
            <select className="field" value={recipeForm.variant_id} onChange={e => setRecipeForm(f => ({ ...f, variant_id: e.target.value }))}>
              <option value="">-- Pilih Varian --</option>
              {variants.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Bahan Baku *</label>
            <select className="field" value={recipeForm.raw_material_id} onChange={e => setRecipeForm(f => ({ ...f, raw_material_id: e.target.value }))}>
              <option value="">-- Pilih Bahan --</option>
              {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
            </select>
          </div>
          <div><label style={lbl}>Jumlah per Botol *</label><input className="field" type="number" placeholder="20" value={recipeForm.quantity_needed} onChange={e => setRecipeForm(f => ({ ...f, quantity_needed: e.target.value }))} /></div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={() => setShowRecipeModal(false)} style={{ flex: 1 }}>Batal</Button>
            <Button onClick={saveRecipe} loading={saving} style={{ flex: 1 }}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Production Modal */}
      <Modal open={showProdModal} onClose={() => setShowProdModal(false)} title="Produksi Batch">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={lbl}>Varian *</label>
            <select className="field" value={prodForm.variant_id} onChange={e => setProdForm(f => ({ ...f, variant_id: e.target.value }))}>
              <option value="">-- Pilih Varian --</option>
              {variants.map(v => <option key={v.id} value={v.id}>{v.name} (stok: {v.stock} pcs)</option>)}
            </select>
          </div>
          <div><label style={lbl}>Jumlah Produksi *</label><input className="field" type="number" placeholder="15" value={prodForm.quantity} onChange={e => setProdForm(f => ({ ...f, quantity: e.target.value }))} /></div>
          <div><label style={lbl}>Catatan</label><input className="field" placeholder="Opsional" value={prodForm.notes} onChange={e => setProdForm(f => ({ ...f, notes: e.target.value }))} /></div>
          {preview.length > 0 && (
            <div style={{ background: '#F9F8F4', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Kebutuhan Bahan</p>
              {preview.map(p => (
                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: '#374151' }}>{p.name}</span>
                  <span style={{ fontWeight: 700, color: p.ok ? '#16A34A' : '#DC2626' }}>{p.needed} / {p.available} {p.ok ? '✓' : '✗ kurang'}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={() => setShowProdModal(false)} style={{ flex: 1 }}>Batal</Button>
            <Button onClick={runProduction} loading={saving} style={{ flex: 1 }} disabled={preview.some(p => !p.ok) && preview.length > 0}>Jalankan Produksi</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }

function Spinner() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}><div style={{ width: 28, height: 28, border: '2.5px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /></div>
}
