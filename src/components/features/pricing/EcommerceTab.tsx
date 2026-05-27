'use client'
import { useState } from 'react'
import { formatRupiah } from '@/lib/utils'
import NumInput from '@/components/ui/NumInput'

const PLATFORMS = [
  { id: 'shopee_regular', name: 'Shopee', sub: 'Regular', fee: 3, color: '#EF4444' },
  { id: 'shopee_mall', name: 'Shopee', sub: 'Mall', fee: 5, color: '#EF4444' },
  { id: 'tokopedia_pm', name: 'Tokopedia', sub: 'Power Merchant', fee: 1.8, color: '#059669' },
  { id: 'tokopedia_os', name: 'Tokopedia', sub: 'Official Store', fee: 3, color: '#059669' },
  { id: 'tiktok', name: 'TikTok Shop', sub: 'Standard', fee: 2.5, color: '#0F172A' },
  { id: 'lazada', name: 'Lazada', sub: 'Standard', fee: 2, color: '#7C3AED' },
  { id: 'custom', name: 'Kustom', sub: 'Isi sendiri', fee: 0, color: '#6366F1' },
]

export function EcommerceTab() {
  const [hpp, setHpp] = useState('')
  const [extra, setExtra] = useState('')
  const [ongkir, setOngkir] = useState('')
  const [targetMargin, setTargetMargin] = useState('30')
  const [platformId, setPlatformId] = useState('shopee_regular')
  const [customFee, setCustomFee] = useState('')
  const [manualPrice, setManualPrice] = useState('')

  const platform = PLATFORMS.find(p => p.id === platformId)!
  const fee = platformId === 'custom' ? (parseFloat(customFee) || 0) : platform.fee
  const parseHpp = (v: string) => parseFloat(v.replace(/\./g, '')) || 0

  const totalCost = parseHpp(hpp) + parseHpp(extra) + parseHpp(ongkir)
  const minPrice = fee < 100 ? totalCost / (1 - fee / 100) : 0
  const targetProfit = (parseFloat(targetMargin) || 0) / 100 * parseHpp(hpp)
  const recPrice = fee < 100 ? (totalCost + targetProfit) / (1 - fee / 100) : 0

  const manualVal = parseHpp(manualPrice)
  const manualAfterFee = manualVal * (1 - fee / 100)
  const manualProfit = manualAfterFee - totalCost
  const manualMargin = totalCost > 0 ? (manualProfit / manualVal) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PLATFORMS.map(p => (
          <button key={p.id} onClick={() => setPlatformId(p.id)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              borderColor: platformId === p.id ? p.color : '#E2E8F0',
              background: platformId === p.id ? `${p.color}10` : '#fff',
              color: platformId === p.id ? p.color : '#64748B',
            }}>{p.name} {p.sub}</button>
        ))}
      </div>
      {platformId === 'custom' && (
        <div>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Fee Platform (%)</label>
          <input value={customFee} onChange={e => setCustomFee(e.target.value)} placeholder="contoh: 3.5"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, marginTop: 4 }} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>HPP per pcs (Rp)</label>
          <NumInput value={hpp} onChange={setHpp} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Biaya Tambahan (Rp)</label>
          <NumInput value={extra} onChange={setExtra} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Subsidi Ongkir (Rp)</label>
          <NumInput value={ongkir} onChange={setOngkir} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Target Margin (%)</label>
          <NumInput value={targetMargin} onChange={setTargetMargin} />
        </div>
      </div>

      <div className="three-col">
        <div className="card" style={{ border: '2px solid #FCA5A5', background: '#FFF5F5' }}>
          <p style={{ fontSize: 11, color: '#DC2626', fontWeight: 700 }}>Harga Minimum (Break Even)</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#DC2626', margin: '4px 0 0' }}>{formatRupiah(minPrice)}</p>
          <p style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Harga terendah tanpa rugi setelah potong fee {fee}%</p>
        </div>
        <div className="card" style={{ border: '2px solid #BBF7D0', background: '#F0FDF4' }}>
          <p style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>Harga Rekomendasi</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#059669', margin: '4px 0 0' }}>{formatRupiah(recPrice)}</p>
          <p style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Dengan margin {targetMargin}%</p>
        </div>
        <div className="card">
          <p style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Simulasi Manual</p>
          <NumInput value={manualPrice} onChange={setManualPrice} placeholder="Harga yg kamu mau" />
          {manualVal > 0 && (
            <>
              <p style={{ fontSize: 13, margin: '8px 0 0' }}>Setelah fee: <strong>{formatRupiah(manualAfterFee)}</strong></p>
              <p style={{ fontSize: 13, color: manualProfit >= 0 ? '#10B981' : '#EF4444' }}>
                Profit: <strong>{formatRupiah(manualProfit)}</strong> ({manualMargin.toFixed(1)}%)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
