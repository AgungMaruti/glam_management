'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { FlaskConical, Plus, Trash2, Edit2, Package, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils'
import { Product, Variant } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

type Mode = 'add-product' | 'edit-product' | 'add-variant' | 'edit-variant' | null

export default function ProductsPage() {
  const [products, setProducts] = useState<(Product & { variants: Variant[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<Mode>(null)
  const [selProduct, setSelProduct] = useState<Product | null>(null)
  const [selVariant, setSelVariant] = useState<Variant | null>(null)
  const [pForm, setPForm] = useState({ name: '', description: '' })
  const [vForm, setVForm] = useState({ name: '', size_ml: '', selling_price: '', stock: '' })

  useEffect(() => { fetch() }, [])

  async function fetch() {
    const { data } = await supabase.from('products').select('*, variants(*)').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  async function saveProduct() {
    if (!pForm.name) return
    setSaving(true)
    if (mode === 'edit-product' && selProduct) {
      await supabase.from('products').update({ name: pForm.name, description: pForm.description }).eq('id', selProduct.id)
    } else {
      await supabase.from('products').insert({ name: pForm.name, description: pForm.description })
    }
    setMode(null); setSaving(false); fetch()
  }

  async function saveVariant() {
    if (!vForm.name || !vForm.selling_price) return
    setSaving(true)
    const payload = { name: vForm.name, size_ml: parseFloat(vForm.size_ml) || 0, selling_price: parseFloat(vForm.selling_price), stock: parseInt(vForm.stock) || 0 }
    if (mode === 'edit-variant' && selVariant) {
      await supabase.from('variants').update(payload).eq('id', selVariant.id)
    } else if (selProduct) {
      await supabase.from('variants').insert({ ...payload, product_id: selProduct.id })
    }
    setMode(null); setSaving(false); fetch()
  }

  async function deleteProduct(id: string) {
    if (!confirm('Hapus produk ini beserta semua variannya?')) return
    await supabase.from('products').delete().eq('id', id); fetch()
  }

  async function deleteVariant(id: string) {
    if (!confirm('Hapus varian ini?')) return
    await supabase.from('variants').delete().eq('id', id); fetch()
  }

  if (loading) return <Spinner />

  return (
    <div className="page-sections">
      <PageHeader
        title="Produk & Varian" subtitle="Kelola katalog dan varian parfum kamu" icon={FlaskConical}
        action={<Button icon={Plus} onClick={() => { setPForm({ name: '', description: '' }); setMode('add-product') }}>Tambah Produk</Button>}
      />

      {products.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FlaskConical size={26} color="#6366F1" />
          </div>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>Belum ada produk. Tambahkan produk parfum pertamamu!</p>
          <Button icon={Plus} onClick={() => { setPForm({ name: '', description: '' }); setMode('add-product') }}>Tambah Produk</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {products.map(product => (
            <div key={product.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Product header */}
              <div style={{ padding: '16px 20px', borderBottom: '1.5px solid #F0EDE8', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={18} color="#6366F1" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h3>
                  {product.description && <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <span className="show-sm"><Button variant="soft" size="sm" icon={Plus}
                    onClick={() => { setSelProduct(product); setVForm({ name: '', size_ml: '', selling_price: '', stock: '' }); setMode('add-variant') }}>Varian</Button></span>
                  <button onClick={() => { setSelProduct(product); setVForm({ name: '', size_ml: '', selling_price: '', stock: '' }); setMode('add-variant') }}
                    style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF2FF', border: 'none', color: '#6366F1', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}
                    className="hide-sm"><Plus size={14} /></button>
                  <button onClick={() => { setSelProduct(product); setPForm({ name: product.name, description: product.description || '' }); setMode('edit-product') }}
                    style={{ width: 32, height: 32, borderRadius: 8, background: '#F9F8F5', border: '1.5px solid #E5E2DC', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => deleteProduct(product.id)}
                    style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Variants */}
              <div style={{ padding: '16px 20px' }}>
                {product.variants.length === 0 ? (
                  <div style={{ border: '2px dashed #E5E2DC', borderRadius: 10, padding: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: '#9CA3AF' }}>Belum ada varian</p>
                    <button onClick={() => { setSelProduct(product); setVForm({ name: '', size_ml: '', selling_price: '', stock: '' }); setMode('add-variant') }}
                      style={{ fontSize: 13, color: '#6366F1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}>+ Tambah varian</button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                    {product.variants.map(v => (
                      <div key={v.id} style={{ background: '#F9F8F4', borderRadius: 11, padding: '12px 14px', border: '1.5px solid #E8E5E0', position: 'relative' }}>
                        {/* Actions */}
                        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 3 }}>
                          <button onClick={() => { setSelVariant(v); setVForm({ name: v.name, size_ml: v.size_ml?.toString() || '', selling_price: v.selling_price.toString(), stock: v.stock.toString() }); setMode('edit-variant') }}
                            style={{ width: 24, height: 24, borderRadius: 6, background: 'none', border: 'none', color: '#C4C0BA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EEF2FF'; (e.currentTarget as HTMLButtonElement).style.color = '#6366F1' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#C4C0BA' }}>
                            <Edit2 size={11} />
                          </button>
                          <button onClick={() => deleteVariant(v.id)}
                            style={{ width: 24, height: 24, borderRadius: 6, background: 'none', border: 'none', color: '#C4C0BA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLButtonElement).style.color = '#DC2626' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#C4C0BA' }}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', paddingRight: 52, lineHeight: 1.3 }}>{v.name}</p>
                        {v.size_ml > 0 && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{v.size_ml} ml</p>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#4338CA' }}>{formatRupiah(v.selling_price)}</span>
                          <span className="badge" style={{
                            background: v.stock > 10 ? '#F0FDF4' : v.stock > 0 ? '#FFFBEB' : '#FEF2F2',
                            color: v.stock > 10 ? '#16A34A' : v.stock > 0 ? '#B45309' : '#B91C1C',
                          }}>{v.stock} pcs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      <Modal open={mode === 'add-product' || mode === 'edit-product'} onClose={() => setMode(null)}
        title={mode === 'edit-product' ? 'Edit Produk' : 'Tambah Produk Baru'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nama Produk *</label>
            <input className="field" placeholder="Parfum Series A" value={pForm.name} onChange={e => setPForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Deskripsi</label>
            <textarea className="field" rows={3} placeholder="Deskripsi singkat..." value={pForm.description} onChange={e => setPForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={() => setMode(null)} style={{ flex: 1 }}>Batal</Button>
            <Button onClick={saveProduct} loading={saving} style={{ flex: 1 }}>{mode === 'edit-product' ? 'Update' : 'Simpan'}</Button>
          </div>
        </div>
      </Modal>

      {/* Variant Modal */}
      <Modal open={mode === 'add-variant' || mode === 'edit-variant'} onClose={() => setMode(null)}
        title={mode === 'edit-variant' ? `Edit Varian — ${selVariant?.name}` : `Tambah Varian — ${selProduct?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'edit-variant' && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 10, background: '#FFFBEB', border: '1.5px solid #FDE68A' }}>
              <AlertTriangle size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#92400E' }}>Edit stok untuk koreksi pencatatan yang salah — stok langsung diperbarui.</p>
            </div>
          )}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nama Varian *</label>
            <input className="field" placeholder="Rose / Varian A" value={vForm.name} onChange={e => setVForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Ukuran (ml)</label>
              <input className="field" type="number" placeholder="35" value={vForm.size_ml} onChange={e => setVForm(f => ({ ...f, size_ml: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Stok (pcs) {mode === 'edit-variant' && <span style={{ color: '#D97706', fontSize: 11 }}>← koreksi</span>}
              </label>
              <input className="field" type="number" placeholder="0" value={vForm.stock} onChange={e => setVForm(f => ({ ...f, stock: e.target.value }))}
                style={mode === 'edit-variant' ? { borderColor: '#F59E0B', background: '#FFFBEB' } : {}} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Harga Jual (Rp) *</label>
            <input className="field" type="number" placeholder="75000" value={vForm.selling_price} onChange={e => setVForm(f => ({ ...f, selling_price: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={() => setMode(null)} style={{ flex: 1 }}>Batal</Button>
            <Button onClick={saveVariant} loading={saving} style={{ flex: 1 }}>{mode === 'edit-variant' ? 'Update' : 'Simpan'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Spinner() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}><div style={{ width: 28, height: 28, border: '2.5px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /></div>
}
