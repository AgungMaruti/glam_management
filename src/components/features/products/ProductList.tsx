'use client'
import { useState } from 'react'
import { Plus, Trash2, Edit2, Search, Download, ShoppingBag, Send, Wallet } from 'lucide-react'
import { formatRupiah, formatNumber } from '@/lib/utils'
import { exportCSV } from '@/lib/csv'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import NumInput from '@/components/ui/NumInput'
import type { Product, Variant, Reseller, Distribution } from '@/types'

interface ProductListProps {
  products: (Product & { variants: (Variant & { total_produced?: number; total_sold?: number })[] })[]
  resellers: Reseller[]
  distributions: (Distribution & { variant?: Variant; reseller?: Reseller })[]
  loading: boolean
  saving: boolean
  onCreateProduct: (name: string, description?: string) => Promise<void>
  onUpdateProduct: (id: string, p: { name: string; description?: string }) => Promise<void>
  onDeleteProduct: (id: string) => Promise<void>
  onCreateVariant: (p: { product_id: string; name: string; size_ml: number; selling_price: number; stock_own: number }) => Promise<void>
  onUpdateVariant: (id: string, p: { name: string; size_ml: number; selling_price: number }) => Promise<void>
  onDeleteVariant: (id: string) => Promise<void>
  onSale: (p: { variantId: string; quantity: number; unitPrice: number; recordCashflow: boolean }) => Promise<void>
  onDistribute: (p: { variantId: string; resellerId: string; quantity: number; pricePerUnit: number }) => Promise<void>
  onResellerPayment: (p: { distributionId: string; quantity: number; amount: number; recordCashflow: boolean }) => Promise<void>
  onCreateReseller: (name: string) => Promise<Reseller>
}

type Mode = 'add-product' | 'edit-product' | 'add-variant' | 'edit-variant' | 'sale' | 'distribute' | 'payment' | null

export function ProductList(props: ProductListProps) {
  const { products, resellers, distributions, loading, saving } = props
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<Mode>(null)
  const [selProduct, setSelProduct] = useState<Product | null>(null)
  const [selVariant, setSelVariant] = useState<Variant | null>(null)
  const [pForm, setPForm] = useState({ name: '', description: '' })
  const [vForm, setVForm] = useState({ name: '', size_ml: '', selling_price: '', stock_own: '' })
  const [saleForm, setSaleForm] = useState({ qty: '', harga: '', catat: true })
  const [distForm, setDistForm] = useState({ qty: '', harga: '', reseller_id: '', reseller_name: '' })
  const [resellerInput, setResellerInput] = useState('')
  const [payForm, setPayForm] = useState({ qty: '', harga: '', dist_id: '', catat: true })

  const parseInput = (v: string) => parseFloat(v.replace(/\./g, '')) || 0

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.variants || []).some(v => v.name.toLowerCase().includes(search.toLowerCase()))
  )

  const handleExport = () => {
    const rows: Record<string, unknown>[] = []
    products.forEach(p => (p.variants || []).forEach(v => rows.push({
      produk: p.name, varian: v.name, size: `${v.size_ml}ml`, harga: v.selling_price, stok_sendiri: v.stock_own, stok_reseller: v.stock_reseller
    })))
    exportCSV(rows, [
      { key: 'produk', label: 'Produk' }, { key: 'varian', label: 'Varian' }, { key: 'size', label: 'Ukuran' },
      { key: 'harga', label: 'Harga Jual' }, { key: 'stok_sendiri', label: 'Stok Sendiri' }, { key: 'stok_reseller', label: 'Stok Reseller' }
    ], 'produk_varian')
  }

  if (loading) return <p className="empty">Memuat data...</p>

  return (
    <div>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="search-box" style={{ flex: 1, minWidth: 200, maxWidth: 480 }}>
          <Search size={16} color="#94A3B8" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk/varian..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: '100%' }} />
        </div>
        <div className="flex-row">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>CSV</Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => { setPForm({ name: '', description: '' }); setMode('add-product') }}>
            Tambah Produk
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">Belum ada produk.</p>
      ) : (
        filtered.map(p => (
          <div key={p.id} className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{p.name}</h3>
                {p.description && <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>{p.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="outline" size="sm" icon={Plus} onClick={() => { setSelProduct(p); setVForm({ name: '', size_ml: '', selling_price: '', stock_own: '' }); setMode('add-variant') }}>
                  Varian
                </Button>
                <Button variant="soft" size="sm" icon={Edit2} onClick={() => { setSelProduct(p); setPForm({ name: p.name, description: p.description || '' }); setMode('edit-product') }}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" icon={Trash2} onClick={async () => {
                  if (confirm(`Hapus produk "${p.name}" dan semua variannya?`)) await props.onDeleteProduct(p.id)
                }} />
              </div>
            </div>

            <div className="two-col-resp">
              {(p.variants || []).map(v => (
                <div key={v.id} className="card" style={{ padding: '14px 16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0, marginRight: 12 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{v.name}</span>
                      <span style={{ fontSize: 12, color: '#94A3B8' }}>· {formatNumber(v.size_ml)} ml</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#4338CA', whiteSpace: 'nowrap', flexShrink: 0 }}>{formatRupiah(v.selling_price)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748B', flexWrap: 'wrap' }}>
                      <span>Stok Sendiri <strong style={{ color: '#334155', fontSize: 13 }}>{v.stock_own}</strong></span>
                      <span>Reseller <strong style={{ color: '#334155', fontSize: 13 }}>{v.stock_reseller}</strong></span>
                      {v.total_sold !== undefined && (
                        <span>Terjual <strong style={{ color: '#334155', fontSize: 13 }}>{v.total_sold}</strong></span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <Button variant="soft" size="sm" onClick={() => { setSelProduct(p); setSelVariant(v); setVForm({ name: v.name, size_ml: String(v.size_ml), selling_price: String(v.selling_price), stock_own: String(v.stock_own) }); setMode('edit-variant') }}>
                        <Edit2 size={12} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={async () => {
                        if (confirm(`Hapus varian "${v.name}"?`)) await props.onDeleteVariant(v.id)
                      }}>
                        <Trash2 size={12} />
                      </Button>
                      <Button variant="primary" size="sm" icon={ShoppingBag} onClick={() => { setSelVariant(v); setSaleForm({ qty: '', harga: String(v.selling_price), catat: true }); setMode('sale') }}>
                        Jual
                      </Button>
                      <Button variant="soft" size="sm" icon={Send} onClick={() => { setSelVariant(v); setDistForm({ qty: '', harga: '', reseller_id: '', reseller_name: '' }); setResellerInput(''); setMode('distribute') }}
                        style={{ background: '#EEF2FF', borderColor: '#C7D2FE', color: '#4338CA' }}>
                        Dist
                      </Button>
                      <Button variant="soft" size="sm" icon={Wallet} onClick={() => { setSelVariant(v); setPayForm({ qty: '', harga: '', dist_id: '', catat: true }); setMode('payment') }}
                        style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}>
                        Bayar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add Product Modal */}
      <Modal open={mode === 'add-product'} title="Tambah Produk" size="sm" onClose={() => setMode(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Nama Produk</label>
              <input value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} placeholder="contoh: Aqua Kiss"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Deskripsi (opsional)</label>
              <input value={pForm.description} onChange={e => setPForm({ ...pForm, description: e.target.value })} placeholder="Keterangan singkat"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setMode(null)}>Batal</Button>
              <Button variant="primary" loading={saving} onClick={async () => {
                await props.onCreateProduct(pForm.name, pForm.description || undefined)
                setMode(null)
              }}>Simpan</Button>
            </div>
          </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal open={mode === 'edit-product' && !!selProduct} title="Edit Produk" size="sm" onClose={() => setMode(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Nama Produk</label>
            <input value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Deskripsi</label>
            <input value={pForm.description} onChange={e => setPForm({ ...pForm, description: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setMode(null)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={async () => {
              await props.onUpdateProduct(selProduct!.id, { name: pForm.name, description: pForm.description || undefined })
              setMode(null)
            }}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Variant Modal */}
      <Modal open={mode === 'add-variant' || mode === 'edit-variant'} title={mode === 'add-variant' ? 'Tambah Varian' : 'Edit Varian'} size="sm" onClose={() => setMode(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Nama Varian</label>
            <input value={vForm.name} onChange={e => setVForm({ ...vForm, name: e.target.value })} placeholder="contoh: Lace 35ml"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Ukuran (ml)</label>
            <NumInput value={vForm.size_ml} onChange={v => setVForm({ ...vForm, size_ml: v })} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Harga Jual (Rp)</label>
            <NumInput value={vForm.selling_price} onChange={v => setVForm({ ...vForm, selling_price: v })} />
          </div>
          {mode === 'add-variant' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Stok Awal Sendiri</label>
              <NumInput value={vForm.stock_own} onChange={v => setVForm({ ...vForm, stock_own: v })} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setMode(null)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={async () => {
              const data = { name: vForm.name, size_ml: parseInput(vForm.size_ml), selling_price: parseInput(vForm.selling_price) }
              if (mode === 'edit-variant' && selVariant) {
                await props.onUpdateVariant(selVariant.id, data)
              } else if (selProduct) {
                await props.onCreateVariant({ ...data, product_id: selProduct.id, stock_own: parseInput(vForm.stock_own) })
              }
              setMode(null)
            }}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Sale Modal */}
      <Modal open={mode === 'sale' && !!selVariant} title={`Jual ${selVariant?.name}`} size="sm" onClose={() => setMode(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#64748B' }}>Stok sendiri tersedia: <strong>{selVariant?.stock_own} pcs</strong></p>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Jumlah Terjual</label>
            <NumInput value={saleForm.qty} onChange={v => setSaleForm({ ...saleForm, qty: v })} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Harga Jual per Pcs (Rp)</label>
            <NumInput value={saleForm.harga} onChange={v => setSaleForm({ ...saleForm, harga: v })} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={saleForm.catat} onChange={e => setSaleForm({ ...saleForm, catat: e.target.checked })} style={{ width: 16, height: 16 }} />
            Catat ke Cashflow
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setMode(null)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={async () => {
              await props.onSale({
                variantId: selVariant!.id,
                quantity: parseInt(saleForm.qty.replace(/\D/g, '')) || 0,
                unitPrice: parseInput(saleForm.harga),
                recordCashflow: saleForm.catat,
              })
              setMode(null)
            }}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Distribution Modal */}
      <Modal open={mode === 'distribute' && !!selVariant} title={`Distribusi ${selVariant?.name}`} size="sm" onClose={() => setMode(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#64748B' }}>Stok sendiri: <strong>{selVariant?.stock_own} pcs</strong></p>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Reseller</label>
            <div style={{ position: 'relative' }}>
              <input value={resellerInput} onChange={e => { setResellerInput(e.target.value); setDistForm({ ...distForm, reseller_name: e.target.value }) }}
                placeholder="Nama reseller (bikin baru atau pilih yang ada)"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
              {resellerInput && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,.1)', zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
                  {resellers.filter(r => r.name.toLowerCase().includes(resellerInput.toLowerCase())).map(r => (
                    <div key={r.id} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #F1F5F9' }}
                      onClick={() => { setDistForm({ ...distForm, reseller_id: r.id, reseller_name: r.name }); setResellerInput(r.name) }}>
                      {r.name}
                    </div>
                  ))}
                  <div style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: '#6366F1', fontWeight: 600 }}
                    onClick={async () => {
                      const r = await props.onCreateReseller(resellerInput.trim())
                      setDistForm({ ...distForm, reseller_id: r.id, reseller_name: r.name })
                      setResellerInput(r.name)
                    }}>
                    + Buat &quot;{resellerInput}&quot;
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Jumlah Dikirim (pcs)</label>
            <NumInput value={distForm.qty} onChange={v => setDistForm({ ...distForm, qty: v })} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Harga ke Reseller per Pcs (Rp)</label>
            <NumInput value={distForm.harga} onChange={v => setDistForm({ ...distForm, harga: v })} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setMode(null)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={async () => {
              await props.onDistribute({
                variantId: selVariant!.id,
                resellerId: distForm.reseller_id,
                quantity: parseInt(distForm.qty.replace(/\D/g, '')) || 0,
                pricePerUnit: parseInput(distForm.harga),
              })
              setMode(null)
            }}>Distribusi</Button>
          </div>
        </div>
      </Modal>

      {/* Reseller Payment Modal */}
      <Modal open={mode === 'payment' && !!selVariant} title={`Reseller Bayar — ${selVariant?.name}`} size="sm" onClose={() => setMode(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#64748B' }}>Pilih distribusi yang dibayar:</p>
          {distributions
            .filter(d => d.variant_id === selVariant?.id && d.status === 'active')
            .map(d => (
              <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid', borderColor: payForm.dist_id === d.id ? '#6366F1' : '#E2E8F0', borderRadius: 8, cursor: 'pointer', background: payForm.dist_id === d.id ? '#EEF2FF' : '#fff' }}>
                <input type="radio" checked={payForm.dist_id === d.id} onChange={() => setPayForm({ ...payForm, dist_id: d.id })}
                  style={{ width: 14, height: 14, accentColor: '#6366F1' }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{d.reseller?.name} — {d.quantity} pcs @{formatRupiah(d.price_per_unit)}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{new Date(d.distributed_at).toLocaleDateString('id-ID')}</p>
                </div>
              </label>
            ))}
          {payForm.dist_id && (
            <>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Jumlah Laku (pcs)</label>
                <NumInput value={payForm.qty} onChange={v => setPayForm({ ...payForm, qty: v })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Total Dibayar (Rp)</label>
                <NumInput value={payForm.harga} onChange={v => setPayForm({ ...payForm, harga: v })} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={payForm.catat} onChange={e => setPayForm({ ...payForm, catat: e.target.checked })}
                  style={{ width: 16, height: 16 }} /> Catat ke Cashflow
              </label>
            </>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setMode(null)}>Batal</Button>
            <Button variant="primary" loading={saving} onClick={async () => {
              await props.onResellerPayment({
                distributionId: payForm.dist_id,
                quantity: parseInt(payForm.qty.replace(/\D/g, '')) || 0,
                amount: parseInput(payForm.harga),
                recordCashflow: payForm.catat,
              })
              setMode(null)
            }}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
