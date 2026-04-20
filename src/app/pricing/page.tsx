'use client'

import { useState } from 'react'
import { ShoppingCart, Users, AlertTriangle, CheckCircle, Info, Store } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import NumInput from '@/components/ui/NumInput'

// ─── E-COMMERCE ───────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'shopee_regular', name: 'Shopee',     sub: 'Regular',        fee: 3,   color: '#EF4444', bg: '#FEF2F2' },
  { id: 'shopee_mall',    name: 'Shopee',     sub: 'Mall',           fee: 5,   color: '#EF4444', bg: '#FEF2F2' },
  { id: 'tokopedia_pm',  name: 'Tokopedia',  sub: 'Power Merchant', fee: 1.8, color: '#059669', bg: '#ECFDF5' },
  { id: 'tokopedia_os',  name: 'Tokopedia',  sub: 'Official Store', fee: 3,   color: '#059669', bg: '#ECFDF5' },
  { id: 'tiktok',        name: 'TikTok Shop',sub: 'Standard',       fee: 2.5, color: '#0F172A', bg: '#F1F5F9' },
  { id: 'lazada',        name: 'Lazada',     sub: 'Standard',       fee: 2,   color: '#7C3AED', bg: '#F5F3FF' },
  { id: 'custom',        name: 'Kustom',     sub: 'Isi sendiri',    fee: 0,   color: '#6366F1', bg: '#EEF2FF' },
]

function EcommerceTab() {
  const [hpp, setHpp] = useState('')
  const [extra, setExtra] = useState('')
  const [ongkir, setOngkir] = useState('')
  const [targetMargin, setTargetMargin] = useState('30')
  const [platformId, setPlatformId] = useState('shopee_regular')
  const [customFee, setCustomFee] = useState('')
  const [manualPrice, setManualPrice] = useState('')

  const platform = PLATFORMS.find(p => p.id === platformId)!
  const fee = platformId === 'custom' ? (parseFloat(customFee) || 0) : platform.fee

  const hppVal    = parseFloat(hpp)    || 0
  const extraVal  = parseFloat(extra)  || 0
  const ongkirVal = parseFloat(ongkir) || 0
  const marginVal = parseFloat(targetMargin) || 0
  const totalCost = hppVal + extraVal + ongkirVal

  const minPrice     = fee < 100 ? totalCost / (1 - fee / 100) : 0
  const targetProfit = (marginVal / 100) * hppVal
  const recPrice     = fee < 100 ? (totalCost + targetProfit) / (1 - fee / 100) : 0

  const manualVal    = parseFloat(manualPrice) || 0
  const manualFeeAmt = manualVal * (fee / 100)
  const manualNet    = manualVal - manualFeeAmt - extraVal - ongkirVal
  const manualProfit = manualNet - hppVal
  const manualMargin = hppVal > 0 ? (manualProfit / hppVal) * 100 : 0
  const isProfit     = manualProfit > 0
  const isBreakEven  = Math.abs(manualProfit) < 1
  const hasInput     = hppVal > 0

  return (
    <div className="two-col-md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <CardHeader title="Biaya Produk" />
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>HPP / Modal per Botol (Rp) *</label>
              <NumInput placeholder="36.000" value={hpp} onChange={setHpp} />
            </div>
            <div>
              <label style={lbl}>Biaya Tambahan per Pcs (Rp)</label>
              <NumInput placeholder="2.000" value={extra} onChange={setExtra} />
              <p style={hint}>Packaging, stiker, kardus, label, dll.</p>
            </div>
            <div>
              <label style={lbl}>Subsidi Ongkos Kirim per Order (Rp)</label>
              <NumInput placeholder="0" value={ongkir} onChange={setOngkir} />
              <p style={hint}>Isi jika kamu menanggung sebagian ongkir pembeli.</p>
            </div>
            <div>
              <label style={lbl}>Target Keuntungan Bersih dari Modal (%)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {[20, 30, 50, 100].map(m => (
                  <button key={m} type="button" onClick={() => setTargetMargin(m.toString())}
                    style={{ padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all .12s', background: targetMargin === m.toString() ? '#6366F1' : '#F1F5F9', color: targetMargin === m.toString() ? '#fff' : '#64748B' }}>
                    {m}%
                  </button>
                ))}
              </div>
              <input className="field" type="number" placeholder="30" value={targetMargin} onChange={e => setTargetMargin(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <CardHeader title="Pilih Platform" />
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="two-col-sm">
              {PLATFORMS.map(p => (
                <button key={p.id} type="button" onClick={() => setPlatformId(p.id)}
                  style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${platformId === p.id ? p.color : '#E2E8F0'}`, background: platformId === p.id ? p.bg : '#fff', transition: 'all .15s', textAlign: 'left' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: platformId === p.id ? p.color : '#0F172A' }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{p.sub} · {p.id === 'custom' ? '—' : `${p.fee}%`}</p>
                </button>
              ))}
            </div>
            {platformId === 'custom' && (
              <div>
                <label style={lbl}>Persentase Fee Platform (%)</label>
                <input className="field" type="number" placeholder="0" step="0.1" value={customFee} onChange={e => setCustomFee(e.target.value)} />
              </div>
            )}
            {fee > 0 && (
              <div style={{ background: '#EEF2FF', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={13} color="#6366F1" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#4338CA' }}>
                  Dari setiap <strong>Rp 100.000</strong> penjualan, platform memotong <strong style={{ color: '#EF4444' }}>{formatRupiah(100000 * fee / 100)}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <CardHeader title="Rekomendasi Harga Jual" />
          <div style={{ padding: '16px 20px' }}>
            {!hasInput ? <EmptyState icon={ShoppingCart} text="Isi HPP terlebih dahulu" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <PriceCard label="Harga Minimum (Break Even)" sub="Di bawah harga ini kamu rugi" price={Math.ceil(minPrice)} color="red" />
                <PriceCard label={`Harga Aman (+${targetMargin}% untung)`} sub={`Bersih masuk ${formatRupiah(Math.round(targetProfit))} per pcs`} price={Math.ceil(recPrice)} color="green" />
                <Breakdown
                  rows={[
                    { label: 'Harga jual di platform',      value:  Math.ceil(recPrice),                          color: '#0F172A', bold: true  },
                    { label: `Potongan platform (${fee}%)`, value: -Math.round(Math.ceil(recPrice) * fee / 100),  color: '#DC2626' },
                    { label: 'Biaya tambahan',              value: -extraVal,   color: extraVal   > 0 ? '#D97706' : '#CBD5E1' },
                    { label: 'Subsidi ongkir',              value: -ongkirVal,  color: ongkirVal  > 0 ? '#D97706' : '#CBD5E1' },
                    { label: 'HPP / modal',                 value: -hppVal,     color: '#EF4444' },
                  ]}
                  totalLabel="Keuntungan Bersih"
                  totalValue={Math.round(targetProfit)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <CardHeader title="Cek Harga yang Sudah Ada" />
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Masukkan harga jual yang ingin dicek (Rp)</label>
              <NumInput placeholder="75.000" value={manualPrice} onChange={setManualPrice} />
            </div>
            {manualVal > 0 && hasInput && (
              <>
                <StatusBanner isProfit={isProfit} isBreakEven={isBreakEven} profit={manualProfit} margin={manualMargin} minPrice={Math.ceil(minPrice)} />
                <Breakdown
                  rows={[
                    { label: 'Harga jual',             value:  manualVal,    color: '#0F172A', bold: true },
                    { label: `Fee platform (${fee}%)`, value: -manualFeeAmt, color: '#DC2626' },
                    { label: 'Biaya tambahan',         value: -extraVal,     color: '#D97706' },
                    { label: 'Subsidi ongkir',         value: -ongkirVal,    color: '#D97706' },
                    { label: 'HPP / modal',            value: -hppVal,       color: '#EF4444' },
                  ].filter(r => r.value !== 0)}
                  totalLabel="Bersih Kamu Terima"
                  totalValue={Math.round(manualProfit)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── RESELLER ─────────────────────────────────────────────────────────────────

function ResellerTab() {
  const [hpp, setHpp] = useState('')
  const [extra, setExtra] = useState('')
  const [ongkirKirim, setOngkirKirim] = useState('')
  const [minOrder, setMinOrder] = useState('1')
  const [targetMargin, setTargetMargin] = useState('30')
  const [marginReseller, setMarginReseller] = useState('40')
  const [manualPrice, setManualPrice] = useState('')

  const hppVal      = parseFloat(hpp)         || 0
  const extraVal    = parseFloat(extra)        || 0
  const ongkirTotal = parseFloat(ongkirKirim)  || 0
  const minOrderVal = Math.max(parseFloat(minOrder) || 1, 1)
  const marginVal   = parseFloat(targetMargin) || 0
  const resellerMgn = parseFloat(marginReseller) || 0

  const ongkirPerUnit = ongkirTotal / minOrderVal
  const totalCost     = hppVal + extraVal + ongkirPerUnit
  const targetProfit  = (marginVal / 100) * hppVal
  const minPrice      = totalCost
  const recPrice      = totalCost + targetProfit

  // Suggested end price for reseller
  const suggestedEndPrice = resellerMgn > 0 ? recPrice / (1 - resellerMgn / 100) : 0

  const manualVal    = parseFloat(manualPrice) || 0
  const manualProfit = manualVal - totalCost
  const manualMargin = hppVal > 0 ? (manualProfit / hppVal) * 100 : 0
  const isProfit     = manualProfit > 0
  const isBreakEven  = Math.abs(manualProfit) < 1
  const hasInput     = hppVal > 0

  return (
    <div className="two-col-md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <CardHeader title="Biaya & Pengiriman" />
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>HPP / Modal per Botol (Rp) *</label>
              <NumInput placeholder="36.000" value={hpp} onChange={setHpp} />
            </div>
            <div>
              <label style={lbl}>Biaya Tambahan per Pcs (Rp)</label>
              <NumInput placeholder="2.000" value={extra} onChange={setExtra} />
              <p style={hint}>Packaging, stiker, bubble wrap, dll.</p>
            </div>
            <div style={{ background: '#EEF2FF', borderRadius: 10, padding: '14px 16px', border: '1px solid #C7D2FE' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#4338CA', marginBottom: 12 }}>Ongkos Kirim ke Reseller</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>Total Ongkir (Rp)</label>
                  <NumInput placeholder="15.000" value={ongkirKirim} onChange={setOngkirKirim} />
                </div>
                <div>
                  <label style={lbl}>Jumlah Produk (pcs)</label>
                  <input className="field" type="number" placeholder="20" min="1" value={minOrder} onChange={e => setMinOrder(e.target.value)} />
                </div>
              </div>
              {ongkirTotal > 0 && minOrderVal > 0 && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Info size={12} color="#6366F1" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: '#4338CA' }}>
                    Ongkir per pcs = <strong>{formatRupiah(Math.round(ongkirPerUnit))}</strong>
                    <span style={{ color: '#94A3B8' }}> ({formatRupiah(ongkirTotal)} ÷ {minOrderVal} pcs)</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <CardHeader title="Target Margin" />
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Keuntungan Kamu dari HPP (%)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {[20, 30, 50, 100].map(m => (
                  <button key={m} type="button" onClick={() => setTargetMargin(m.toString())}
                    style={{ padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all .12s', background: targetMargin === m.toString() ? '#6366F1' : '#F1F5F9', color: targetMargin === m.toString() ? '#fff' : '#64748B' }}>
                    {m}%
                  </button>
                ))}
              </div>
              <input className="field" type="number" placeholder="30" value={targetMargin} onChange={e => setTargetMargin(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Berapa Persen Reseller Biasanya Ambil Untung (%)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {[30, 40, 50].map(m => (
                  <button key={m} type="button" onClick={() => setMarginReseller(m.toString())}
                    style={{ padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all .12s', background: marginReseller === m.toString() ? '#10B981' : '#F1F5F9', color: marginReseller === m.toString() ? '#fff' : '#64748B' }}>
                    {m}%
                  </button>
                ))}
              </div>
              <input className="field" type="number" placeholder="40" value={marginReseller} onChange={e => setMarginReseller(e.target.value)} />
              <p style={hint}>Opsional — biar kamu tahu kira-kira reseller jual ke konsumen seharga berapa.</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <CardHeader title="Harga yang Kamu Kasih ke Reseller" />
          <div style={{ padding: '16px 20px' }}>
            {!hasInput ? <EmptyState icon={Users} text="Isi HPP terlebih dahulu" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <PriceCard label="Harga Minimum — Titik Impas" sub="Jangan jual di bawah ini, kamu tidak untung sama sekali" price={Math.ceil(minPrice)} color="red" />
                <PriceCard label={`Harga Jual ke Reseller (untung ${targetMargin}%)`} sub={`Kamu bersih terima ${formatRupiah(Math.round(targetProfit))} per pcs setelah semua biaya`} price={Math.ceil(recPrice)} color="green" />

                {suggestedEndPrice > 0 && (
                  <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#7C3AED', marginBottom: 3 }}>Reseller Bisa Jual ke Konsumen Seharga</p>
                        <p style={{ fontSize: 11, color: '#A78BFA' }}>Kalau reseller ambil untung {marginReseller}% dari harga belinya ke kamu</p>
                      </div>
                      <p style={{ fontSize: 20, fontWeight: 800, color: '#7C3AED', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{formatRupiah(Math.ceil(suggestedEndPrice))}</p>
                    </div>
                  </div>
                )}

                <Breakdown
                  rows={[
                    { label: 'Harga jual kamu ke reseller', value:  Math.ceil(recPrice), color: '#0F172A', bold: true },
                    { label: 'Biaya tambahan',              value: -extraVal,            color: extraVal      > 0 ? '#D97706' : '#CBD5E1' },
                    { label: 'Ongkir kirim ke reseller',    value: -ongkirPerUnit,       color: ongkirPerUnit > 0 ? '#D97706' : '#CBD5E1' },
                    { label: 'HPP / modal',                 value: -hppVal,              color: '#EF4444' },
                  ]}
                  totalLabel="Keuntungan Bersih Kamu"
                  totalValue={Math.round(targetProfit)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <CardHeader title="Cek Harga yang Sudah Kamu Tetapkan" />
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Masukkan harga jual ke reseller yang ingin dicek (Rp)</label>
              <NumInput placeholder="55.000" value={manualPrice} onChange={setManualPrice} />
            </div>
            {manualVal > 0 && hasInput && (
              <>
                <StatusBanner isProfit={isProfit} isBreakEven={isBreakEven} profit={manualProfit} margin={manualMargin} minPrice={Math.ceil(minPrice)} />
                <Breakdown
                  rows={[
                    { label: 'Harga reseller',  value:  manualVal,      color: '#0F172A', bold: true },
                    { label: 'Biaya tambahan',  value: -extraVal,       color: '#D97706' },
                    { label: 'Ongkir per unit', value: -ongkirPerUnit,  color: '#D97706' },
                    { label: 'HPP / modal',     value: -hppVal,         color: '#EF4444' },
                  ].filter(r => r.value !== 0)}
                  totalLabel="Bersih Kamu Terima"
                  totalValue={Math.round(manualProfit)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function CardHeader({ title }: { title: string }) {
  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{title}</h3>
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <Icon size={28} color="#E2E8F0" style={{ margin: '0 auto 10px' }} />
      <p style={{ fontSize: 13, color: '#CBD5E1' }}>{text}</p>
    </div>
  )
}

function PriceCard({ label, sub, price, color }: { label: string; sub: string; price: number; color: 'red' | 'green' }) {
  const c = color === 'red'
    ? { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', sub: '#F87171' }
    : { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A', sub: '#4ADE80' }
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: c.text, marginBottom: 3 }}>{label}</p>
          <p style={{ fontSize: 11, color: c.sub }}>{sub}</p>
        </div>
        <p style={{ fontSize: 20, fontWeight: 800, color: c.text, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{formatRupiah(price)}</p>
      </div>
    </div>
  )
}

function Breakdown({ rows, totalLabel, totalValue }: {
  rows: { label: string; value: number; color: string; bold?: boolean }[]
  totalLabel: string
  totalValue: number
}) {
  return (
    <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px', border: '1px solid #E2E8F0' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Rincian</p>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < rows.length - 1 ? '1px dashed #E2E8F0' : 'none' }}>
          <span style={{ fontSize: 13, color: '#64748B' }}>{r.label}</span>
          <span style={{ fontSize: 13, fontWeight: r.bold ? 700 : 600, color: r.color }}>
            {r.value < 0 ? `- ${formatRupiah(-r.value)}` : formatRupiah(r.value)}
          </span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '2px solid #E2E8F0' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{totalLabel}</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: totalValue >= 0 ? '#16A34A' : '#DC2626' }}>
          {totalValue >= 0 ? '+' : ''}{formatRupiah(totalValue)}
        </span>
      </div>
    </div>
  )
}

function StatusBanner({ isProfit, isBreakEven, profit, margin, minPrice }: {
  isProfit: boolean; isBreakEven: boolean; profit: number; margin: number; minPrice: number
}) {
  return (
    <div style={{ background: isProfit ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${isProfit ? '#BBF7D0' : '#FECACA'}`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      {isProfit
        ? <CheckCircle size={22} color="#16A34A" style={{ flexShrink: 0 }} />
        : <AlertTriangle size={22} color="#DC2626" style={{ flexShrink: 0 }} />}
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: isProfit ? '#16A34A' : '#DC2626' }}>
          {isBreakEven ? 'Break Even — tidak untung, tidak rugi'
            : isProfit ? `Untung ${formatRupiah(Math.round(profit))} per pcs`
            : `Rugi ${formatRupiah(Math.round(-profit))} per pcs`}
        </p>
        <p style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
          Margin {margin.toFixed(1)}% dari modal · Harga minimum {formatRupiah(minPrice)}
        </p>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

type TabKey = 'ecommerce' | 'reseller'

export default function PricingPage() {
  const [tab, setTab] = useState<TabKey>('ecommerce')

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'ecommerce', label: 'E-Commerce', icon: Store },
    { key: 'reseller',  label: 'Reseller',   icon: Users },
  ]

  return (
    <div className="page-sections">
      <PageHeader
        title="Kalkulator Harga"
        subtitle="Hitung harga jual aman untuk setiap channel penjualan"
        icon={ShoppingCart}
      />

      <div className="tab-bar">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} className={`tab-item ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {tab === 'ecommerce' && <EcommerceTab />}
      {tab === 'reseller'  && <ResellerTab />}
    </div>
  )
}

const lbl: React.CSSProperties  = { fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }
const hint: React.CSSProperties = { fontSize: 11, color: '#94A3B8', marginTop: 4 }
