'use client'
import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import NumInput from '@/components/ui/NumInput'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { Rad, RadItem } from '@/types'

interface RadListProps {
  data: (Rad & { items: RadItem[] })[]
  loading: boolean
  saving: boolean
  onCreate: (p: {
    title: string; batch_quantity: number; selling_price: number; salary_cost: number; other_cost: number
    hpp_bahan: number; hpp_full_cost: number
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
const MARGIN_PRESETS = [10, 20, 30, 40, 50]

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
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [batchQty, setBatchQty] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [salaryCost, setSalaryCost] = useState('')
  const [otherCost, setOtherCost] = useState('')
  const [items, setItems] = useState<ItemForm[]>(STARTER_ITEMS.map(i => ({ ...i })))
  const [selectedMargin, setSelectedMargin] = useState('30')

  const parseInput = (v: string) => parseFloat(v.replace(/\./g, '')) || 0
  const addItem = () => setItems([...items, { name: '', total_qty: '', unit: 'pcs', total_cost: '', usage_per_bottle: '' }])
  const removeItem = (i: number) => { const n = [...items]; n.splice(i, 1); setItems(n) }

  const totalHpp = items.reduce((s, i) => s + calcHppPerBottle(i), 0)
  const qty = parseInt(batchQty.replace(/\D/g, '')) || 0
  const gaji = parseInput(salaryCost)
  const lain = parseInput(otherCost)
  const price = parseInput(sellingPrice)
  const overheadPerBotol = qty > 0 ? (gaji + lain) / qty : 0
  const hppBahan = totalHpp
  const hppFullCost = totalHpp + overheadPerBotol
  const totalRevenue = price * qty
  const totalHppBatch = totalHpp * qty
  const netProfit = totalRevenue - totalHppBatch - gaji - lain
  const marginPct = parseFloat(selectedMargin) || 0
  const suggestedPrice = hppFullCost > 0 ? hppFullCost * (1 + marginPct / 100) : 0
  const marginPerUnit = suggestedPrice - hppFullCost

  if (loading) return <p className="empty">Memuat data...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => {
          setTitle(''); setBatchQty(''); setSellingPrice(''); setSalaryCost(''); setOtherCost('')
          setItems(STARTER_ITEMS.map(i => ({ ...i })))
          setSelectedMargin('30')
          setShowModal(true)
        }}>Buat RAD Baru</Button>
      </div>

      {data.length === 0 ? (
        <p className="empty">Belum ada RAD.</p>
      ) : (
        data.map(rad => {
          const hpp = calcHpp(rad.items || [])
          const displayFull = rad.hpp_full_cost > 0 ? rad.hpp_full_cost : hpp
          const displayBahan = rad.hpp_bahan > 0 ? rad.hpp_bahan : hpp
          const overheadTotal = (rad.salary_cost || 0) + (rad.other_cost || 0)
          const overheadPerUnit = rad.batch_quantity > 0 ? overheadTotal / rad.batch_quantity : 0
          const marginBahan = rad.selling_price - displayBahan
          const marginBahanPct = rad.selling_price > 0 ? (marginBahan / rad.selling_price) * 100 : 0
          const marginFullCost = rad.selling_price - displayFull
          const marginFullCostPct = displayFull > 0 ? (marginFullCost / displayFull) * 100 : 0
          return (
            <div key={rad.id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => { const s = new Set(expanded); if (s.has(rad.id)) { s.delete(rad.id) } else { s.add(rad.id) }; setExpanded(s) }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{rad.title}</h4>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>
                    Batch {rad.batch_quantity} pcs &middot; Full Cost/produk {formatRupiah(displayFull)} &middot; {new Date(rad.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Button variant="ghost" size="sm" icon={Trash2} onClick={e => { e.stopPropagation(); setDeleteId(rad.id) }} />
                  {expanded.has(rad.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
               {expanded.has(rad.id) && (
                 <div style={{ marginTop: 16, padding: 16, background: '#F8FAFC', borderRadius: 8 }}>
                   <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Detail Biaya per Produk</h5>
                   <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                     <thead>
                       <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                         <th style={{ textAlign: 'left', padding: 6 }}>Item</th>
                         <th style={{ textAlign: 'right', padding: 6 }}>Biaya/Produk</th>
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

                   {/* Overhead Section */}
                   {overheadTotal > 0 && (
                     <div style={{ marginTop: 14, padding: 12, background: '#FFFBEB', borderRadius: 8, border: '1px solid #FDE68A' }}>
                       <h6 style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>Detail Biaya Operasional</h6>
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12 }}>
                         <div>
                           <span style={{ color: '#64748B' }}>Gaji Karyawan</span>
                           <p style={{ fontWeight: 700, margin: '2px 0 0' }}>{formatRupiah(rad.salary_cost || 0)}</p>
                         </div>
                         <div>
                           <span style={{ color: '#64748B' }}>Biaya Lain</span>
                           <p style={{ fontWeight: 700, margin: '2px 0 0' }}>{formatRupiah(rad.other_cost || 0)}</p>
                         </div>
                         <div>
                           <span style={{ color: '#64748B' }}>Total Overhead</span>
                           <p style={{ fontWeight: 700, margin: '2px 0 0', color: '#D97706' }}>{formatRupiah(overheadTotal)}</p>
                         </div>
                         <div>
                           <span style={{ color: '#64748B' }}>Overhead/Produk</span>
                           <p style={{ fontWeight: 700, margin: '2px 0 0', color: '#DC2626' }}>
                             {formatRupiah(overheadPerUnit)}
                           </p>
                           <p style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                             ({formatRupiah(overheadTotal)} ÷ {rad.batch_quantity} pcs)
                           </p>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* 2-Row Summary Grid */}
                   <div style={{ marginTop: 16 }}>
                     {/* Row 1: HPP */}
                     <div className="three-col" style={{ margin: 0, marginBottom: 10 }}>
                       <div>
                         <span style={{ fontSize: 11, color: '#94A3B8' }}>HPP Bahan/Produk</span>
                         <p style={{ fontWeight: 700, fontSize: 15, margin: '4px 0 0', color: '#059669' }}>{formatRupiah(displayBahan)}</p>
                       </div>
                       <div>
                         <span style={{ fontSize: 11, color: '#94A3B8' }}>Biaya Ops/Produk</span>
                         <p style={{ fontWeight: 700, fontSize: 15, margin: '4px 0 0', color: '#D97706' }}>{formatRupiah(overheadPerUnit)}</p>
                       </div>
                       <div>
                         <span style={{ fontSize: 11, color: '#94A3B8' }}>HPP Full Cost/Produk</span>
                         <p style={{ fontWeight: 700, fontSize: 15, margin: '4px 0 0', color: '#DC2626' }}>{formatRupiah(displayFull)}</p>
                       </div>
                     </div>
                     {/* Row 2: Margin + Harga Jual */}
                     <div className="three-col" style={{ margin: 0 }}>
                       <div>
                         <span style={{ fontSize: 11, color: '#94A3B8' }}>Margin (HPP Bahan)</span>
                         <p style={{ fontWeight: 700, fontSize: 15, margin: '4px 0 0', color: marginBahan > 0 ? '#10B981' : '#EF4444' }}>
                           {formatRupiah(marginBahan)}
                           <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginLeft: 4 }}>
                             ({marginBahanPct.toFixed(0)}%)
                           </span>
                         </p>
                       </div>
                       <div>
                         <span style={{ fontSize: 11, color: '#94A3B8' }}>Margin (Full Cost)</span>
                         <p style={{ fontWeight: 700, fontSize: 15, margin: '4px 0 0', color: marginFullCost > 0 ? '#10B981' : '#EF4444' }}>
                           {formatRupiah(marginFullCost)}
                           <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginLeft: 4 }}>
                             ({marginFullCostPct.toFixed(0)}%)
                           </span>
                         </p>
                       </div>
                       <div>
                         <span style={{ fontSize: 11, color: '#94A3B8' }}>Harga Jual</span>
                         <p style={{ fontWeight: 700, fontSize: 15, margin: '4px 0 0', color: '#4338CA' }}>{formatRupiah(rad.selling_price)}</p>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
            </div>
          )
        })
      )}

      {/* CREATE RAD MODAL */}
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

          {/* Items table */}
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

          {/* HPP Preview */}
          <div className="card" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <div className="three-col" style={{ margin: 0 }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748B' }}>HPP Bahan/Produk</span>
                <p style={{ fontWeight: 800, fontSize: 16, margin: '2px 0 0', color: '#059669' }}>{formatRupiah(hppBahan)}</p>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748B' }}>Biaya Ops/Produk</span>
                <p style={{ fontWeight: 800, fontSize: 16, margin: '2px 0 0', color: '#D97706' }}>{formatRupiah(overheadPerBotol)}</p>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748B' }}>HPP Full Cost/Produk</span>
                <p style={{ fontWeight: 800, fontSize: 16, margin: '2px 0 0', color: '#DC2626' }}>{formatRupiah(hppFullCost)}</p>
              </div>
            </div>

            {/* Margin Selector */}
            <div style={{ marginTop: 16, padding: 14, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#4338CA', marginBottom: 10 }}>Pilih Margin Keuntungan</p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                {MARGIN_PRESETS.map(m => (
                  <button key={m} onClick={() => setSelectedMargin(String(m))}
                    style={{
                      padding: '7px 14px', borderRadius: 8, border: '1.5px solid',
                      borderColor: marginPct === m ? '#4338CA' : '#D1D5DB',
                      background: marginPct === m ? '#C7D2FE' : '#fff',
                      color: marginPct === m ? '#312E81' : '#64748B',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>{m}%</button>
                ))}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="number" min={0} max={500} value={selectedMargin}
                    onChange={e => setSelectedMargin(e.target.value)}
                    style={{ width: 60, padding: '6px 8px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontWeight: 600, textAlign: 'center', outline: 'none', fontFamily: 'inherit', background: '#fff' }} />
                  <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>%</span>
                </div>
              </div>

              {/* Selected margin preview */}
              {hppFullCost > 0 && selectedMargin && (
                <div style={{ padding: '12px 14px', background: '#fff', borderRadius: 8 }}>
                  <p style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>Saran Harga Jual (margin {marginPct}%)</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#4338CA', margin: 0 }}>{formatRupiah(suggestedPrice)}</p>
                  <p style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                    Profit/Produk: <strong style={{ color: '#059669' }}>{formatRupiah(marginPerUnit)}</strong>
                    &nbsp;({hppFullCost > 0 ? ((marginPerUnit / hppFullCost) * 100).toFixed(0) : 0}% dari full cost)
                  </p>
                </div>
              )}

              {/* All presets summary */}
              {hppFullCost > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {MARGIN_PRESETS.map(m => {
                    const p = hppFullCost * (1 + m / 100)
                    return (
                      <div key={m} style={{
                        padding: '6px 10px', background: marginPct === m ? '#C7D2FE' : '#F1F5F9',
                        borderRadius: 6, fontSize: 11, cursor: 'pointer', textAlign: 'center',
                        border: marginPct === m ? '1.5px solid #4338CA' : '1px solid transparent',
                      }} onClick={() => setSelectedMargin(String(m))}>
                        <span style={{ color: '#64748B' }}>{m}%</span><br />
                        <strong style={{ color: '#4338CA' }}>{formatRupiah(p)}</strong>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Profit preview */}
            {qty > 0 && (
              <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Profit untuk {qty} pcs:</p>
                <div style={{ display: 'flex', gap: 24, marginTop: 8, fontSize: 13 }}>
                  <div><span style={{ color: '#64748B' }}>Revenue</span><p style={{ fontWeight: 700, margin: '2px 0' }}>{formatRupiah(totalRevenue)}</p></div>
                  <div><span style={{ color: '#64748B' }}>HPP Bahan</span><p style={{ fontWeight: 700, margin: '2px 0' }}>{formatRupiah(totalHppBatch)}</p></div>
                  <div><span style={{ color: '#64748B' }}>Overhead</span><p style={{ fontWeight: 700, margin: '2px 0' }}>{formatRupiah(gaji + lain)}</p></div>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ color: '#64748B', fontSize: 13 }}>Net Profit: </span>
                  <strong style={{ fontSize: 15, color: netProfit >= 0 ? '#10B981' : '#EF4444' }}>{formatRupiah(netProfit)}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Gaji & Biaya Lain */}
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
                hpp_bahan: hppBahan,
                hpp_full_cost: hppFullCost,
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
      <ConfirmModal
        open={!!deleteId}
        title="Konfirmasi Hapus"
        message="RAD yang dihapus tidak bisa dikembalikan. Lanjutkan?"
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) onRemove(deleteId); setDeleteId(null) }}
      />
    </div>
  )
}
