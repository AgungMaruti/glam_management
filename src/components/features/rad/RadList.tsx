'use client'
import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import NumInput from '@/components/ui/NumInput'
import type { Rad, RadItem } from '@/types'

interface RadListProps {
  data: (Rad & { items: RadItem[] })[]
  loading: boolean
  saving: boolean
  onCreate: (p: {
    title: string; batch_quantity: number; selling_price: number; salary_cost: number; other_cost: number
    items: { name: string; total_qty: number; unit: string; total_cost: number; usage_per_bottle: number }[]
  }) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

const UNITS = ['ml', 'gram', 'pcs', 'liter', 'kg']
const STARTER_ITEMS = [
  { name: 'Bibit Parfum', total_qty: '', unit: 'ml', total_cost: '', usage_per_bottle: '20' },
  { name: 'Absolut/Alkohol', total_qty: '', unit: 'ml', total_cost: '', usage_per_bottle: '15' },
  { name: 'Botol', total_qty: '', unit: 'pcs', total_cost: '', usage_per_bottle: '1' },
  { name: 'Stiker', total_qty: '', unit: 'pcs', total_cost: '', usage_per_bottle: '1' },
  { name: 'Box', total_qty: '', unit: 'pcs', total_cost: '', usage_per_bottle: '1' },
]

interface ItemForm { name: string; total_qty: string; unit: string; total_cost: string; usage_per_bottle: string }

function calcHppPerBottle(item: ItemForm) {
  const qty = parseFloat(item.total_qty) || 0
  const cost = parseFloat(item.total_cost) || 0
  const usage = parseFloat(item.usage_per_bottle) || 0
  return qty === 0 ? 0 : (cost / qty) * usage
}

function calcHpp(items: RadItem[]) {
  return items.reduce((s, i) => s + (i.total_qty > 0 ? (i.total_cost / i.total_qty) * i.usage_per_bottle : 0), 0)
}

export function RadList({ data, loading, saving, onCreate, onRemove }: RadListProps) {
  const [showModal, setShowModal] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [title, setTitle] = useState('')
  const [batchQty, setBatchQty] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [salaryCost, setSalaryCost] = useState('')
  const [otherCost, setOtherCost] = useState('')
  const [items, setItems] = useState<ItemForm[]>(STARTER_ITEMS.map(i => ({ ...i })))

  const parseInput = (v: string) => parseFloat(v.replace(/\./g, '')) || 0
  const addItem = () => setItems([...items, { name: '', total_qty: '', unit: 'pcs', total_cost: '', usage_per_bottle: '' }])
  const removeItem = (i: number) => { const n = [...items]; n.splice(i, 1); setItems(n) }

  const totalHpp = items.reduce((s, i) => s + calcHppPerBottle(i), 0)
  const qty = parseInt(batchQty.replace(/\D/g, '')) || 0
  const gaji = parseInput(salaryCost)
  const lain = parseInput(otherCost)
  const price = parseInput(sellingPrice)
  const totalRevenue = price * qty
  const totalHppBatch = totalHpp * qty
  const netProfit = totalRevenue - totalHppBatch - gaji - lain

  if (loading) return <p className="empty">Memuat data...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => {
          setTitle(''); setBatchQty(''); setSellingPrice(''); setSalaryCost(''); setOtherCost('')
          setItems(STARTER_ITEMS.map(i => ({ ...i })))
          setShowModal(true)
        }}>+ Buat RAD Baru</Button>
      </div>

      {data.length === 0 ? (
        <p className="empty">Belum ada RAD.</p>
      ) : (
        data.map(rad => {
          const hpp = calcHpp(rad.items || [])
          const margin = rad.selling_price - hpp
          return (
            <div key={rad.id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => { const s = new Set(expanded); if (s.has(rad.id)) { s.delete(rad.id) } else { s.add(rad.id) }; setExpanded(s) }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{rad.title}</h4>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>
                    Batch {rad.batch_quantity} pcs &middot; HPP/botol {formatRupiah(hpp)} &middot; {new Date(rad.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Button variant="ghost" size="sm" icon={Trash2} onClick={e => { e.stopPropagation(); onRemove(rad.id) }} />
                  {expanded.has(rad.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              {expanded.has(rad.id) && (
                <div style={{ marginTop: 16, padding: 16, background: '#F8FAFC', borderRadius: 8 }}>
                  <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Detail Biaya per Botol</h5>
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ textAlign: 'left', padding: 6 }}>Item</th>
                        <th style={{ textAlign: 'right', padding: 6 }}>Biaya/Botol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(rad.items || []).map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: 6 }}>{item.name}</td>
                          <td style={{ textAlign: 'right', padding: 6 }}>
                            {formatRupiah(item.total_qty > 0 ? (item.total_cost / item.total_qty) * item.usage_per_bottle : 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="three-col" style={{ marginTop: 16 }}>
                    <div><span style={{ fontSize: 11, color: '#94A3B8' }}>HPP/Botol</span><p style={{ fontWeight: 700, fontSize: 15, margin: '4px 0 0' }}>{formatRupiah(hpp)}</p></div>
                    <div><span style={{ fontSize: 11, color: '#94A3B8' }}>Harga Jual</span><p style={{ fontWeight: 700, fontSize: 15, margin: '4px 0 0' }}>{formatRupiah(rad.selling_price)}</p></div>
                    <div><span style={{ fontSize: 11, color: '#94A3B8' }}>Margin/Botol</span><p style={{ fontWeight: 700, fontSize: 15, margin: '4px 0 0', color: margin > 0 ? '#10B981' : '#EF4444' }}>{formatRupiah(margin)}</p></div>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}

      <Modal open={showModal} title="Buat RAD Baru" size="lg" onClose={() => setShowModal(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul RAD (contoh: Batch Mei 2026)"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Jumlah Batch (pcs)</label>
              <NumInput value={batchQty} onChange={setBatchQty} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Harga Jual per Pcs (Rp)</label>
              <NumInput value={sellingPrice} onChange={setSellingPrice} />
            </div>
          </div>

            <div className="card" style={{ background: '#F8FAFC', maxHeight: 280, overflowY: 'auto' }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: 2, minWidth: 120 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Nama</label>
                    <input value={item.name} onChange={e => { const n = [...items]; n[i].name = e.target.value; setItems(n) }}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 80 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Qty Beli</label>
                    <NumInput value={item.total_qty} onChange={v => { const n = [...items]; n[i].total_qty = v; setItems(n) }} />
                  </div>
                  <div style={{ width: 60 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Satuan</label>
                    <select value={item.unit} onChange={e => { const n = [...items]; n[i].unit = e.target.value; setItems(n) }}
                      style={{ width: '100%', padding: '6px 4px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12 }}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Harga Total (Rp)</label>
                    <NumInput value={item.total_cost} onChange={v => { const n = [...items]; n[i].total_cost = v; setItems(n) }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 80 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Pakai/Botol</label>
                    <NumInput value={item.usage_per_bottle} onChange={v => { const n = [...items]; n[i].usage_per_bottle = v; setItems(n) }} />
                  </div>
                  <div style={{ paddingBottom: 4 }}>
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => removeItem(i)} />
                  </div>
                </div>
              ))}
              <Button variant="soft" size="sm" icon={Plus} onClick={addItem} style={{ marginTop: 4 }}>Tambah Item</Button>
            </div>

            <div className="card" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div className="three-col" style={{ margin: 0 }}>
                <div><span style={{ fontSize: 11, color: '#64748B' }}>HPP/Botol</span><p style={{ fontWeight: 800, fontSize: 16, margin: '2px 0 0', color: '#059669' }}>{formatRupiah(totalHpp)}</p></div>
                <div><span style={{ fontSize: 11, color: '#64748B' }}>Saran Harga (30%)</span><p style={{ fontWeight: 800, fontSize: 16, margin: '2px 0 0', color: '#4338CA' }}>{formatRupiah(totalHpp > 0 ? totalHpp * 1.3 : 0)}</p></div>
                <div><span style={{ fontSize: 11, color: '#64748B' }}>Saran Harga (50%)</span><p style={{ fontWeight: 800, fontSize: 16, margin: '2px 0 0', color: '#4338CA' }}>{formatRupiah(totalHpp > 0 ? totalHpp * 1.5 : 0)}</p></div>
              </div>
              {qty > 0 && (
                <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Profit untuk {qty} pcs:</p>
                  <div style={{ display: 'flex', gap: 24, marginTop: 8, fontSize: 13 }}>
                    <div><span style={{ color: '#64748B' }}>Revenue</span><p style={{ fontWeight: 700, margin: '2px 0' }}>{formatRupiah(totalRevenue)}</p></div>
                    <div><span style={{ color: '#64748B' }}>HPP Total</span><p style={{ fontWeight: 700, margin: '2px 0' }}>{formatRupiah(totalHppBatch)}</p></div>
                    <div><span style={{ color: '#64748B' }}>Net Profit</span><p style={{ fontWeight: 700, margin: '2px 0', color: netProfit >= 0 ? '#10B981' : '#EF4444' }}>{formatRupiah(netProfit)}</p></div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Gaji Karyawan (opsional)</label>
                <NumInput value={salaryCost} onChange={setSalaryCost} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Biaya Lain (opsional)</label>
                <NumInput value={otherCost} onChange={setOtherCost} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowModal(false)}>Batal</Button>
              <Button variant="primary" loading={saving} onClick={async () => {
                await onCreate({
                  title,
                  batch_quantity: parseInt(batchQty.replace(/\D/g, '')) || 0,
                  selling_price: price,
                  salary_cost: gaji,
                  other_cost: lain,
                  items: items.map(i => ({
                    name: i.name,
                    total_qty: parseInput(i.total_qty),
                    unit: i.unit,
                    total_cost: parseInput(i.total_cost),
                    usage_per_bottle: parseInput(i.usage_per_bottle),
                  })),
                })
                setShowModal(false)
              }}>Simpan RAD</Button>
            </div>
          </div>
      </Modal>
    </div>
  )
}
