'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calculator, Plus, Trash2, ChevronDown, ChevronUp, Users, DollarSign, Package, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface RADItem { name: string; total_qty: string; unit: string; total_cost: string; usage_per_bottle: string }
interface RADItemDB { id: string; rad_id: string; name: string; total_qty: number; unit: string; total_cost: number; usage_per_bottle: number }
interface RAD { id: string; title: string; batch_quantity: number; selling_price: number; salary_cost: number; other_cost: number; created_at: string; items?: RADItemDB[] }

const UNITS = ['ml', 'gram', 'pcs', 'liter', 'kg']
const STARTER: RADItem[] = [
  { name: 'Bibit Parfum', total_qty: '', unit: 'ml', total_cost: '', usage_per_bottle: '20' },
  { name: 'Absolut/Alkohol', total_qty: '', unit: 'ml', total_cost: '', usage_per_bottle: '15' },
  { name: 'Botol', total_qty: '', unit: 'pcs', total_cost: '', usage_per_bottle: '1' },
  { name: 'Stiker', total_qty: '', unit: 'pcs', total_cost: '', usage_per_bottle: '1' },
  { name: 'Box', total_qty: '', unit: 'pcs', total_cost: '', usage_per_bottle: '1' },
]

function cpb(item: RADItem) {
  const qty = parseFloat(item.total_qty) || 0
  const cost = parseFloat(item.total_cost) || 0
  const usage = parseFloat(item.usage_per_bottle) || 0
  return qty === 0 ? 0 : (cost / qty) * usage
}

function getHpp(items: RADItemDB[]) {
  return items.reduce((s, i) => s + (i.total_qty > 0 ? (i.total_cost / i.total_qty) * i.usage_per_bottle : 0), 0)
}

export default function RADPage() {
  const [rads, setRads] = useState<RAD[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [batchQty, setBatchQty] = useState('1')
  const [sellPrice, setSellPrice] = useState('')
  const [salary, setSalary] = useState('')
  const [other, setOther] = useState('')
  const [items, setItems] = useState<RADItem[]>(STARTER.map(i => ({ ...i })))

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('rad').select('*, items:rad_items(*)').order('created_at', { ascending: false })
    setRads(data || [])
    setLoading(false)
  }

  const prevHpp = items.reduce((s, i) => s + cpb(i), 0)
  const prevQty = parseInt(batchQty) || 1
  const prevSell = parseFloat(sellPrice) || 0
  const prevNet = prevSell * prevQty - prevHpp * prevQty - (parseFloat(salary) || 0) - (parseFloat(other) || 0)

  async function saveRAD() {
    if (!title || !batchQty) return
    const valid = items.filter(i => i.name && i.total_cost)
    if (!valid.length) return
    setSaving(true)
    const { data: rad } = await supabase.from('rad').insert({
      title, batch_quantity: parseInt(batchQty),
      selling_price: parseFloat(sellPrice) || 0,
      salary_cost: parseFloat(salary) || 0,
      other_cost: parseFloat(other) || 0,
    }).select().single()
    if (rad) {
      await supabase.from('rad_items').insert(valid.map(i => ({
        rad_id: rad.id, name: i.name,
        total_qty: parseFloat(i.total_qty) || 1, unit: i.unit,
        total_cost: parseFloat(i.total_cost) || 0,
        usage_per_bottle: parseFloat(i.usage_per_bottle) || 1,
      })))
    }
    setTitle(''); setBatchQty('1'); setSellPrice(''); setSalary(''); setOther('')
    setItems(STARTER.map(i => ({ ...i }))); setShowModal(false); setSaving(false); load()
  }

  async function deleteRAD(id: string) {
    if (!confirm('Hapus RAD ini?')) return
    await supabase.from('rad').delete().eq('id', id); load()
  }

  if (loading) return <Spinner />

  return (
    <div className="page-sections">
      <PageHeader title="RAD & HPP Calculator" subtitle="Hitung HPP proporsional & estimasi profit bersih" icon={Calculator}
        action={<Button icon={Plus} onClick={() => setShowModal(true)}>Buat RAD Baru</Button>}
      />

      {rads.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Calculator size={26} color="#6366F1" />
          </div>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>Belum ada RAD. Buat rencana anggaran pertamamu!</p>
          <Button icon={Plus} onClick={() => setShowModal(true)}>Buat RAD</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rads.map((rad, i) => {
            const hpp = getHpp(rad.items || [])
            const revenue = rad.selling_price * rad.batch_quantity
            const totalHpp = hpp * rad.batch_quantity
            const netProfit = revenue - totalHpp - rad.salary_cost - rad.other_cost
            const isOpen = expandedId === rad.id

            return (
              <div key={rad.id} className="card" style={{ overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background .15s' }}
                  onClick={() => setExpandedId(isOpen ? null : rad.id)}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#FAFAF8'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calculator size={17} color="#6366F1" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rad.title}</p>
                    <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{rad.batch_quantity} pcs · {new Date(rad.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="show-sm-flex" style={{ gap: 20, alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 11, color: '#9CA3AF' }}>HPP/botol</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{formatRupiah(hpp)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 11, color: '#9CA3AF' }}>Net Profit</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: netProfit >= 0 ? '#16A34A' : '#DC2626' }}>{formatRupiah(netProfit)}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button onClick={e => { e.stopPropagation(); deleteRAD(rad.id) }}
                      style={{ width: 30, height: 30, borderRadius: 8, background: 'none', border: 'none', color: '#D1D5DB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLButtonElement).style.color = '#DC2626' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#D1D5DB' }}>
                      <Trash2 size={13} />
                    </button>
                    {isOpen ? <ChevronUp size={15} color="#9CA3AF" /> : <ChevronDown size={15} color="#9CA3AF" />}
                  </div>
                </div>

                {/* Mobile quick stats */}
                <div className="hide-sm" style={{ padding: '0 18px 12px', gap: 16 }}>
                  <div><p style={{ fontSize: 11, color: '#9CA3AF' }}>HPP/botol</p><p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{formatRupiah(hpp)}</p></div>
                  <div><p style={{ fontSize: 11, color: '#9CA3AF' }}>Net Profit</p><p style={{ fontSize: 13, fontWeight: 700, color: netProfit >= 0 ? '#16A34A' : '#DC2626' }}>{formatRupiah(netProfit)}</p></div>
                </div>

                {/* Expanded */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div style={{ borderTop: '1.5px solid #F0EDE8', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Items */}
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Rincian Biaya</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(rad.items || []).map(item => {
                              const c = item.total_qty > 0 ? (item.total_cost / item.total_qty) * item.usage_per_bottle : 0
                              return (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderRadius: 8, background: '#F9F8F4' }}>
                                  <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.name}</p>
                                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{item.total_qty} {item.unit} = {formatRupiah(item.total_cost)} · pakai {item.usage_per_bottle} {item.unit}/botol</p>
                                  </div>
                                  <span className="badge" style={{ background: '#EEF2FF', color: '#4338CA' }}>{formatRupiah(c)}/botol</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Summary grid */}
                        <div className="four-col-md">
                          {[
                            { label: 'HPP/botol', value: formatRupiah(hpp), color: '#111827', bg: '#F9F8F4' },
                            { label: 'Harga Jual', value: formatRupiah(rad.selling_price), color: '#4338CA', bg: '#EEF2FF' },
                            { label: 'Margin/botol', value: formatRupiah(rad.selling_price - hpp), color: '#16A34A', bg: '#F0FDF4' },
                            { label: 'Margin %', value: `${rad.selling_price > 0 && hpp > 0 ? (((rad.selling_price - hpp) / hpp) * 100).toFixed(0) : 0}%`, color: '#B45309', bg: '#FFFBEB' },
                          ].map(s => (
                            <div key={s.label} style={{ borderRadius: 10, padding: '10px 12px', textAlign: 'center', background: s.bg }}>
                              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{s.label}</p>
                              <p style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Profit calc */}
                        <div style={{ background: '#F9F8F4', borderRadius: 10, padding: '14px 16px', border: '1.5px solid #E8E5E0' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Kalkulasi Profit ({rad.batch_quantity} pcs)</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7280' }}>Revenue</span><span style={{ fontWeight: 600, color: '#111827' }}>{formatRupiah(revenue)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7280' }}>Total HPP</span><span style={{ fontWeight: 600, color: '#DC2626' }}>- {formatRupiah(totalHpp)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E8E5E0', paddingTop: 8 }}><span style={{ fontWeight: 600, color: '#374151' }}>Gross Profit</span><span style={{ fontWeight: 700, color: '#16A34A' }}>{formatRupiah(revenue - totalHpp)}</span></div>
                            {rad.salary_cost > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7280' }}>Gaji Karyawan</span><span style={{ fontWeight: 600, color: '#D97706' }}>- {formatRupiah(rad.salary_cost)}</span></div>}
                            {rad.other_cost > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7280' }}>Biaya Lain</span><span style={{ fontWeight: 600, color: '#D97706' }}>- {formatRupiah(rad.other_cost)}</span></div>}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E8E5E0', paddingTop: 8 }}>
                              <span style={{ fontWeight: 800, color: '#111827', fontSize: 14 }}>NET PROFIT</span>
                              <span style={{ fontWeight: 800, fontSize: 16, color: netProfit >= 0 ? '#16A34A' : '#DC2626' }}>{formatRupiah(netProfit)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Buat RAD Baru" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Judul RAD *</label><input className="field" placeholder="Batch April 2026" value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><label style={lbl}>Jumlah Produksi (pcs) *</label><input className="field" type="number" placeholder="15" value={batchQty} onChange={e => setBatchQty(e.target.value)} /></div>
          </div>

          {/* Items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ ...lbl, marginBottom: 0 }}>Rincian Biaya</label>
              <button onClick={() => setItems(p => [...p, { name: '', total_qty: '', unit: 'pcs', total_cost: '', usage_per_bottle: '1' }])}
                style={{ fontSize: 12, color: '#6366F1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={12} /> Tambah Item
              </button>
            </div>
            <div style={{ background: '#EFF6FF', borderRadius: 9, padding: '8px 12px', marginBottom: 10, display: 'flex', gap: 8, border: '1.5px solid #BFDBFE' }}>
              <Info size={13} color="#3B82F6" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#1D4ED8' }}>Input qty total yang dibeli & pemakaian per botol — HPP dihitung proporsional otomatis</p>
            </div>

            {/* Scrollable table */}
            <div style={{ overflowX: 'auto', margin: '0 -2px' }}>
              {/* Header */}
              <div style={{ display: 'grid', gap: 6, padding: '0 2px 4px', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1fr 28px', minWidth: 560 }}>
                {['Nama Item', 'Qty Beli', 'Satuan', 'Harga Total (Rp)', 'Pakai/Botol', ''].map(h => (
                  <p key={h} style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{h}</p>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gap: 6, alignItems: 'center', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1fr 28px', minWidth: 560 }}>
                    <input className="field" style={{ fontSize: 13, padding: '7px 10px' }} placeholder="Nama bahan" value={item.name} onChange={e => setItems(p => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
                    <input className="field" style={{ fontSize: 13, padding: '7px 10px' }} type="number" placeholder="1000" value={item.total_qty} onChange={e => setItems(p => p.map((x, idx) => idx === i ? { ...x, total_qty: e.target.value } : x))} />
                    <select className="field" style={{ fontSize: 13, padding: '7px 10px' }} value={item.unit} onChange={e => setItems(p => p.map((x, idx) => idx === i ? { ...x, unit: e.target.value } : x))}>{UNITS.map(u => <option key={u}>{u}</option>)}</select>
                    <input className="field" style={{ fontSize: 13, padding: '7px 10px' }} type="number" placeholder="45000" value={item.total_cost} onChange={e => setItems(p => p.map((x, idx) => idx === i ? { ...x, total_cost: e.target.value } : x))} />
                    <input className="field" style={{ fontSize: 13, padding: '7px 10px' }} type="number" placeholder="15" value={item.usage_per_bottle} onChange={e => setItems(p => p.map((x, idx) => idx === i ? { ...x, usage_per_bottle: e.target.value } : x))} />
                    <button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}
                      style={{ width: 28, height: 28, borderRadius: 7, background: 'none', border: 'none', color: '#D1D5DB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLButtonElement).style.color = '#DC2626' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = '#D1D5DB' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Live HPP preview */}
            {items.some(i => cpb(i) > 0) && (
              <div style={{ marginTop: 10, background: '#EEF2FF', borderRadius: 10, padding: '12px 14px', border: '1.5px solid #C7D2FE' }}>
                {items.filter(i => cpb(i) > 0).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#6B7280' }}>{item.name || `Item ${i + 1}`}</span>
                    <span style={{ fontWeight: 700, color: '#4338CA' }}>{formatRupiah(cpb(item))}/botol</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid #C7D2FE', paddingTop: 8, marginTop: 4 }}>
                  <span style={{ fontWeight: 700, color: '#374151' }}>Total HPP</span>
                  <span style={{ fontWeight: 800, color: '#4338CA' }}>{formatRupiah(prevHpp)}/botol</span>
                </div>
              </div>
            )}
          </div>

          {/* Price & costs */}
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            {[
              { label: 'Harga Jual/pcs (Rp)', icon: DollarSign, val: sellPrice, set: setSellPrice },
              { label: 'Gaji Karyawan (Rp)', icon: Users, val: salary, set: setSalary },
              { label: 'Biaya Lain (Rp)', icon: Package, val: other, set: setOther },
            ].map(f => (
              <div key={f.label}>
                <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <f.icon size={12} color="#9CA3AF" />{f.label}
                </label>
                <input className="field" type="number" placeholder="0" value={f.val} onChange={e => f.set(e.target.value)} />
              </div>
            ))}
          </div>

          {/* Preview */}
          {prevHpp > 0 && prevSell > 0 && (
            <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '14px 16px', border: '1.5px solid #BBF7D0' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', marginBottom: 10 }}>Preview Kalkulasi</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7280' }}>HPP/botol:</span><span style={{ fontWeight: 700, color: '#111827' }}>{formatRupiah(prevHpp)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7280' }}>Harga jual:</span><span style={{ fontWeight: 700, color: '#4338CA' }}>{formatRupiah(prevSell)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7280' }}>Saran (30%):</span><span style={{ fontWeight: 600, color: '#16A34A' }}>{formatRupiah(prevHpp * 1.3)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7280' }}>Saran (50%):</span><span style={{ fontWeight: 600, color: '#16A34A' }}>{formatRupiah(prevHpp * 1.5)}</span></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13, borderTop: '1px solid #BBF7D0', paddingTop: 10, marginTop: 8 }}>
                <span style={{ color: '#374151' }}>Net Profit ({prevQty} pcs):</span>
                <span style={{ color: prevNet >= 0 ? '#16A34A' : '#DC2626', fontSize: 15, fontWeight: 800 }}>{formatRupiah(prevNet)}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <Button variant="ghost" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Batal</Button>
            <Button onClick={saveRAD} loading={saving} style={{ flex: 1 }}>Simpan RAD</Button>
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
