'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { FlaskConical, Plus, Trash2, Edit2, Package, AlertTriangle, Send, ShoppingBag, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils'
import { Product, Variant } from '@/types'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import NumInput from '@/components/ui/NumInput'

type Mode = 'add-product' | 'edit-product' | 'add-variant' | 'edit-variant' | 'distribusi' | 'jual-sendiri' | 'reseller-bayar' | null

export default function ProductsPage() {
  const [products, setProducts] = useState<(Product & { variants: Variant[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<Mode>(null)
  const [selProduct, setSelProduct] = useState<Product | null>(null)
  const [selVariant, setSelVariant] = useState<Variant | null>(null)
  const [pForm, setPForm] = useState({ name: '', description: '' })
  const [vForm, setVForm] = useState({ name: '', size_ml: '', selling_price: '', stock: '' })
  const [distForm, setDistForm] = useState({ qty: '', harga: '', keterangan: '' })
  const [jualForm, setJualForm] = useState({ qty: '', harga: '', catat: true, keterangan: '' })
  const [resellerForm, setResellerForm] = useState({ qty: '', harga: '', catat: true, keterangan: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const [prodRes, salesRes, productsRes] = await Promise.all([
      supabase.from('productions').select('variant_id, quantity'),
      supabase.from('sales').select('variant_id, quantity'),
      supabase.from('products').select('*, variants(*)').order('created_at', { ascending: false }),
    ])

    const productions = prodRes.data || []
    const sales = salesRes.data || []
    const rawProducts = productsRes.data || []

    const producedMap: Record<string, number> = {}
    productions.forEach(p => { producedMap[p.variant_id] = (producedMap[p.variant_id] || 0) + p.quantity })
    const soldMap: Record<string, number> = {}
    sales.forEach(s => { soldMap[s.variant_id] = (soldMap[s.variant_id] || 0) + s.quantity })

    const enriched = rawProducts.map(product => ({
      ...product,
      variants: product.variants.map((v: Variant) => ({
        ...v,
        total_produced: producedMap[v.id] || 0,
        total_sold: soldMap[v.id] || 0,
      })),
    }))

    setProducts(enriched)
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
    setMode(null); setSaving(false); load()
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
    setMode(null); setSaving(false); load()
  }

  async function saveDistribusi() {
    if (!selVariant || !distForm.qty || !distForm.harga) return
    const qty = parseInt(distForm.qty)
    if (qty <= 0 || qty > selVariant.stock) return
    setSaving(true)
    await supabase.from('variants').update({
      stock: selVariant.stock - qty,
      stock_reseller: (selVariant.stock_reseller || 0) + qty,
    }).eq('id', selVariant.id)
    setMode(null); setSaving(false); load()
  }

  async function saveJualSendiri() {
    if (!selVariant || !jualForm.qty || !jualForm.harga) return
    const qty = parseInt(jualForm.qty)
    const harga = parseFloat(jualForm.harga)
    if (qty <= 0 || qty > selVariant.stock) return
    setSaving(true)
    await supabase.from('variants').update({ stock: selVariant.stock - qty }).eq('id', selVariant.id)
    await supabase.from('sales').insert({
      variant_id: selVariant.id, quantity: qty,
      unit_price: harga, total_amount: harga * qty,
      sold_at: new Date().toISOString(),
    })
    if (jualForm.catat) {
      const desc = jualForm.keterangan ? `Jual ${selVariant.name} x${qty} — ${jualForm.keterangan}` : `Jual ${selVariant.name} x${qty}`
      await supabase.from('cashflow').insert({
        type: 'income', category: 'Penjualan',
        amount: harga * qty, description: desc,
        transaction_date: new Date().toISOString().split('T')[0],
      })
    }
    setMode(null); setSaving(false); load()
  }

  async function saveResellerBayar() {
    if (!selVariant || !resellerForm.qty || !resellerForm.harga) return
    const qty = parseInt(resellerForm.qty)
    const harga = parseFloat(resellerForm.harga)
    if (qty <= 0 || qty > (selVariant.stock_reseller || 0)) return
    setSaving(true)
    await supabase.from('variants').update({ stock_reseller: (selVariant.stock_reseller || 0) - qty }).eq('id', selVariant.id)
    if (resellerForm.catat) {
      const desc = resellerForm.keterangan ? `Reseller — ${selVariant.name} x${qty} — ${resellerForm.keterangan}` : `Reseller — ${selVariant.name} x${qty}`
      await supabase.from('cashflow').insert({
        type: 'income', category: 'Penjualan Reseller',
        amount: harga * qty, description: desc,
        transaction_date: new Date().toISOString().split('T')[0],
      })
    }
    setMode(null); setSaving(false); load()
  }

  async function deleteProduct(id: string) {
    if (!confirm('Hapus produk ini beserta semua variannya?')) return
    await supabase.from('products').delete().eq('id', id); load()
  }

  async function deleteVariant(id: string) {
    if (!confirm('Hapus varian ini?')) return
    await supabase.from('variants').delete().eq('id', id); load()
  }

  if (loading) return <Spinner />

  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }

  return (
    <div className="page-sections">
      <PageHeader
        title="Produk & Varian" subtitle="Kelola katalog dan varian parfum kamu" icon={FlaskConical}
        action={<Button icon={Plus} onClick={() => { setPForm({ name: '', description: '' }); setMode('add-product') }}>Tambah Produk</Button>}
      />

      {products.length === 0 ? (
        <div className="card" style={{ padding: '36px 20px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FlaskConical size={26} color="#6366F1" />
          </div>
          <p style={{ color: '#64748B', fontSize: 14, marginBottom: 16 }}>Belum ada produk. Tambahkan produk parfum pertamamu!</p>
          <Button icon={Plus} onClick={() => { setPForm({ name: '', description: '' }); setMode('add-product') }}>Tambah Produk</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {products.map(product => (
            <div key={product.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Product header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={18} color="#6366F1" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h3>
                  {product.description && <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <span className="show-sm"><Button variant="soft" size="md" icon={Plus}
                    onClick={() => { setSelProduct(product); setVForm({ name: '', size_ml: '', selling_price: '', stock: '' }); setMode('add-variant') }}>Varian</Button></span>
                  <button onClick={() => { setSelProduct(product); setVForm({ name: '', size_ml: '', selling_price: '', stock: '' }); setMode('add-variant') }}
                    style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF2FF', border: 'none', color: '#6366F1', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}
                    className="hide-sm"><Plus size={14} /></button>
                  <button onClick={() => { setSelProduct(product); setPForm({ name: product.name, description: product.description || '' }); setMode('edit-product') }}
                    style={{ width: 32, height: 32, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => deleteProduct(product.id)}
                    style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Variants */}
              <div style={{ padding: '16px 20px' }}>
                {product.variants.length === 0 ? (
                  <div style={{ border: '2px dashed #E2E8F0', borderRadius: 10, padding: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: '#94A3B8' }}>Belum ada varian</p>
                    <button onClick={() => { setSelProduct(product); setVForm({ name: '', size_ml: '', selling_price: '', stock: '' }); setMode('add-variant') }}
                      style={{ fontSize: 13, color: '#6366F1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}>+ Tambah varian</button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                    {product.variants.map(v => (
                      <div key={v.id} style={{ background: '#F8FAFC', borderRadius: 11, padding: '12px 14px', border: '1px solid #E2E8F0', position: 'relative' }}>
                        {/* Edit/Delete */}
                        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 3 }}>
                          <button onClick={() => { setSelVariant(v); setVForm({ name: v.name, size_ml: v.size_ml?.toString() || '', selling_price: v.selling_price.toString(), stock: v.stock.toString() }); setMode('edit-variant') }}
                            style={{ width: 24, height: 24, borderRadius: 6, background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EEF2FF'; (e.currentTarget as HTMLButtonElement).style.color = '#6366F1' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#CBD5E1' }}>
                            <Edit2 size={11} />
                          </button>
                          <button onClick={() => deleteVariant(v.id)}
                            style={{ width: 24, height: 24, borderRadius: 6, background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLButtonElement).style.color = '#DC2626' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#CBD5E1' }}>
                            <Trash2 size={11} />
                          </button>
                        </div>

                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', paddingRight: 52, lineHeight: 1.3 }}>{v.name}</p>
                        {v.size_ml > 0 && <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{v.size_ml} ml</p>}

                        <div style={{ fontSize: 13, fontWeight: 700, color: '#4338CA', marginTop: 8 }}>{formatRupiah(v.selling_price)}</div>

                        {/* Breakdown produksi */}
                        {(v.total_produced || 0) > 0 && (
                          <div style={{ marginTop: 8, marginBottom: 4, padding: '8px 10px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                              Produksi: {v.total_produced} pcs
                            </p>
                            <div style={{ marginBottom: 5 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 600 }}>Terjual</span>
                                <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 700 }}>{v.total_sold} pcs</span>
                              </div>
                              <div style={{ height: 4, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 99, background: '#16A34A', width: `${Math.min(((v.total_sold || 0) / (v.total_produced || 1)) * 100, 100)}%` }} />
                              </div>
                            </div>
                            <div style={{ marginBottom: 5 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                <span style={{ fontSize: 10, color: '#6366F1', fontWeight: 600 }}>Reseller</span>
                                <span style={{ fontSize: 10, color: '#6366F1', fontWeight: 700 }}>{v.stock_reseller} pcs</span>
                              </div>
                              <div style={{ height: 4, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 99, background: '#6366F1', width: `${Math.min(((v.stock_reseller || 0) / (v.total_produced || 1)) * 100, 100)}%` }} />
                              </div>
                            </div>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                <span style={{ fontSize: 10, color: '#D97706', fontWeight: 600 }}>Sendiri</span>
                                <span style={{ fontSize: 10, color: '#D97706', fontWeight: 700 }}>{v.stock} pcs</span>
                              </div>
                              <div style={{ height: 4, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 99, background: '#D97706', width: `${Math.min(((v.stock || 0) / (v.total_produced || 1)) * 100, 100)}%` }} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Stock rows */}
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#64748B' }}>Stok Sendiri</span>
                            <span className="badge" style={{
                              background: v.stock > 10 ? '#F0FDF4' : v.stock > 0 ? '#FFFBEB' : '#FEF2F2',
                              color: v.stock > 10 ? '#16A34A' : v.stock > 0 ? '#B45309' : '#B91C1C',
                            }}>{v.stock} pcs</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#64748B' }}>Stok Reseller</span>
                            <span className="badge" style={{
                              background: (v.stock_reseller || 0) > 0 ? '#EEF2FF' : '#F8FAFC',
                              color: (v.stock_reseller || 0) > 0 ? '#4338CA' : '#94A3B8',
                            }}>{v.stock_reseller || 0} pcs</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                          <button onClick={() => { setSelVariant(v); setDistForm({ qty: '', harga: '', keterangan: '' }); setMode('distribusi') }}
                            title="Distribusi ke Reseller"
                            style={{ flex: 1, height: 28, borderRadius: 7, background: '#EEF2FF', border: 'none', color: '#6366F1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                            <Send size={11} /> Dist
                          </button>
                          <button onClick={() => { setSelVariant(v); setJualForm({ qty: '', harga: v.selling_price.toString(), catat: true, keterangan: '' }); setMode('jual-sendiri') }}
                            title="Catat Penjualan Sendiri"
                            style={{ flex: 1, height: 28, borderRadius: 7, background: '#F0FDF4', border: 'none', color: '#16A34A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                            <ShoppingBag size={11} /> Jual
                          </button>
                          <button onClick={() => { setSelVariant(v); setResellerForm({ qty: '', harga: '', catat: true, keterangan: '' }); setMode('reseller-bayar') }}
                            title="Reseller Bayar"
                            style={{ flex: 1, height: 28, borderRadius: 7, background: '#FFFBEB', border: 'none', color: '#B45309', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                            <Wallet size={11} /> Bayar
                          </button>
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
            <label style={lbl}>Nama Produk *</label>
            <input className="field" placeholder="Parfum Series A" value={pForm.name} onChange={e => setPForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Deskripsi</label>
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
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <AlertTriangle size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#92400E' }}>Edit stok untuk koreksi pencatatan yang salah — stok langsung diperbarui.</p>
            </div>
          )}
          <div>
            <label style={lbl}>Nama Varian *</label>
            <input className="field" placeholder="Rose / Varian A" value={vForm.name} onChange={e => setVForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Ukuran (ml)</label>
              <input className="field" type="number" placeholder="35" value={vForm.size_ml} onChange={e => setVForm(f => ({ ...f, size_ml: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Stok (pcs) {mode === 'edit-variant' && <span style={{ color: '#D97706', fontSize: 11 }}>← koreksi</span>}</label>
              <input className="field" type="number" placeholder="0" value={vForm.stock} onChange={e => setVForm(f => ({ ...f, stock: e.target.value }))}
                style={mode === 'edit-variant' ? { borderColor: '#F59E0B', background: '#FFFBEB' } : {}} />
            </div>
          </div>
          <div>
            <label style={lbl}>Harga Jual (Rp) *</label>
            <NumInput className="field" placeholder="75000" value={vForm.selling_price} onChange={v => setVForm(f => ({ ...f, selling_price: v }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={() => setMode(null)} style={{ flex: 1 }}>Batal</Button>
            <Button onClick={saveVariant} loading={saving} style={{ flex: 1 }}>{mode === 'edit-variant' ? 'Update' : 'Simpan'}</Button>
          </div>
        </div>
      </Modal>

      {/* Distribusi Modal */}
      <Modal open={mode === 'distribusi'} onClose={() => setMode(null)} title={`Distribusi ke Reseller — ${selVariant?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 10, background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
            <Send size={14} color="#6366F1" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: '#3730A3' }}>Stok sendiri berkurang, stok reseller bertambah. Cashflow belum bergerak.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#94A3B8' }}>Stok Sendiri</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{selVariant?.stock ?? 0}</p>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#94A3B8' }}>Stok Reseller</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#4338CA' }}>{selVariant?.stock_reseller ?? 0}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Jumlah (pcs) *</label>
              <input className="field" type="number" placeholder="0" value={distForm.qty}
                onChange={e => setDistForm(f => ({ ...f, qty: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Harga ke Reseller (Rp) *</label>
              <NumInput className="field" placeholder="65000" value={distForm.harga}
                onChange={v => setDistForm(f => ({ ...f, harga: v }))} />
            </div>
          </div>
          {distForm.qty && distForm.harga && (
            <p style={{ fontSize: 12, color: '#64748B' }}>
              Total nilai: <strong style={{ color: '#4338CA' }}>{formatRupiah(parseInt(distForm.qty || '0') * parseFloat(distForm.harga || '0'))}</strong>
            </p>
          )}
          <div>
            <label style={lbl}>Keterangan (opsional)</label>
            <input className="field" placeholder="Nama reseller / catatan..." value={distForm.keterangan}
              onChange={e => setDistForm(f => ({ ...f, keterangan: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={() => setMode(null)} style={{ flex: 1 }}>Batal</Button>
            <Button onClick={saveDistribusi} loading={saving} style={{ flex: 1 }}>Distribusi</Button>
          </div>
        </div>
      </Modal>

      {/* Jual Sendiri Modal */}
      <Modal open={mode === 'jual-sendiri'} onClose={() => setMode(null)} title={`Catat Penjualan — ${selVariant?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#94A3B8' }}>Stok Sendiri</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{selVariant?.stock ?? 0}</p>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#94A3B8' }}>Harga Normal</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#4338CA' }}>{formatRupiah(selVariant?.selling_price ?? 0)}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Jumlah Terjual (pcs) *</label>
              <input className="field" type="number" placeholder="1" value={jualForm.qty}
                onChange={e => setJualForm(f => ({ ...f, qty: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Harga Jual (Rp) *</label>
              <NumInput className="field" placeholder="75000" value={jualForm.harga}
                onChange={v => setJualForm(f => ({ ...f, harga: v }))} />
            </div>
          </div>
          {jualForm.qty && jualForm.harga && (
            <p style={{ fontSize: 12, color: '#64748B' }}>
              Total: <strong style={{ color: '#16A34A' }}>{formatRupiah(parseInt(jualForm.qty || '0') * parseFloat(jualForm.harga || '0'))}</strong>
            </p>
          )}
          <div>
            <label style={lbl}>Keterangan (opsional)</label>
            <input className="field" placeholder="Nama pembeli / catatan..." value={jualForm.keterangan}
              onChange={e => setJualForm(f => ({ ...f, keterangan: e.target.value }))} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
            <input type="checkbox" checked={jualForm.catat} onChange={e => setJualForm(f => ({ ...f, catat: e.target.checked }))} />
            Catat otomatis ke Cashflow
          </label>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={() => setMode(null)} style={{ flex: 1 }}>Batal</Button>
            <Button onClick={saveJualSendiri} loading={saving} style={{ flex: 1 }}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Reseller Bayar Modal */}
      <Modal open={mode === 'reseller-bayar'} onClose={() => setMode(null)} title={`Reseller Bayar — ${selVariant?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <Wallet size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: '#92400E' }}>Catat pembayaran dari reseller. Stok reseller berkurang, cashflow masuk.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#94A3B8' }}>Stok Reseller</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#4338CA' }}>{selVariant?.stock_reseller ?? 0}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Jumlah Laku (pcs) *</label>
              <input className="field" type="number" placeholder="1" value={resellerForm.qty}
                onChange={e => setResellerForm(f => ({ ...f, qty: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Harga per Pcs (Rp) *</label>
              <NumInput className="field" placeholder="65000" value={resellerForm.harga}
                onChange={v => setResellerForm(f => ({ ...f, harga: v }))} />
            </div>
          </div>
          {resellerForm.qty && resellerForm.harga && (
            <p style={{ fontSize: 12, color: '#64748B' }}>
              Total masuk: <strong style={{ color: '#16A34A' }}>{formatRupiah(parseInt(resellerForm.qty || '0') * parseFloat(resellerForm.harga || '0'))}</strong>
            </p>
          )}
          <div>
            <label style={lbl}>Keterangan (opsional)</label>
            <input className="field" placeholder="Nama reseller / catatan..." value={resellerForm.keterangan}
              onChange={e => setResellerForm(f => ({ ...f, keterangan: e.target.value }))} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
            <input type="checkbox" checked={resellerForm.catat} onChange={e => setResellerForm(f => ({ ...f, catat: e.target.checked }))} />
            Catat otomatis ke Cashflow
          </label>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={() => setMode(null)} style={{ flex: 1 }}>Batal</Button>
            <Button onClick={saveResellerBayar} loading={saving} style={{ flex: 1 }}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Spinner() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}><div style={{ width: 28, height: 28, border: '2.5px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /></div>
}
