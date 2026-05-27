'use client'
import { useState } from 'react'
import { formatRupiah } from '@/lib/utils'
import NumInput from '@/components/ui/NumInput'

const MARGIN_PRESETS = [10, 15, 20, 25, 30]

export function ResellerTab() {
  const [hpp, setHpp] = useState('')
  const [extra, setExtra] = useState('')
  const [margin, setMargin] = useState('30')
  const [shipCost, setShipCost] = useState('')
  const [shipQty, setShipQty] = useState('')
  const [resellerMargin, setResellerMargin] = useState('20')
  const [manualPrice, setManualPrice] = useState('')

  const parseHpp = (v: string) => parseFloat(v.replace(/\./g, '')) || 0

  const totalCost = parseHpp(hpp) + parseHpp(extra)
  const shipPerPcs = parseHpp(shipQty) > 0 ? parseHpp(shipCost) / parseHpp(shipQty) : 0
  const costWithShip = totalCost + shipPerPcs
  const targetProfit = (parseFloat(margin) || 0) / 100 * costWithShip
  const resellerPrice = costWithShip + targetProfit

  const resellerMarginPct = parseFloat(resellerMargin) || 0
  const resellerMarginVal = resellerMarginPct / 100
  const consumerPrice = resellerMarginVal < 100 ? resellerPrice / (1 - resellerMarginVal) : 0

  const manualVal = parseHpp(manualPrice)
  const manualProfit = manualVal - costWithShip
  const manualMargin = costWithShip > 0 ? (manualProfit / costWithShip) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          <label style={{ fontSize: 13, fontWeight: 600 }}>Margin Kamu (%)</label>
          <NumInput value={margin} onChange={setMargin} />
        </div>
      </div>

      <div className="card" style={{ background: '#F8FAFC', padding: 16 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Biaya Kirim ke Reseller</h4>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Total Ongkir (Rp)</label>
            <NumInput value={shipCost} onChange={setShipCost} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Jumlah Produk Dikirim (pcs)</label>
            <NumInput value={shipQty} onChange={setShipQty} />
          </div>
        </div>
        {shipPerPcs > 0 && <p style={{ fontSize: 13, color: '#64748B', marginTop: 8 }}>Ongkir per pcs: <strong>{formatRupiah(shipPerPcs)}</strong></p>}
      </div>

      <div className="two-col-resp">
        <div className="card" style={{ border: '2px solid #C7D2FE', background: '#EEF2FF' }}>
          <p style={{ fontSize: 11, color: '#4338CA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Harga ke Reseller</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: '#4338CA', margin: '6px 0 0' }}>{formatRupiah(resellerPrice)}</p>
          <p style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>Margin kamu <strong>{margin}%</strong> dari biaya + ongkir</p>
          <div style={{ marginTop: 12, padding: 10, background: '#fff', borderRadius: 8 }}>
            <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>HPP: {formatRupiah(totalCost)} &middot; Ongkir/pcs: {formatRupiah(shipPerPcs)}</p>
            <p style={{ fontSize: 11, color: '#64748B', margin: '3px 0 0' }}>Total Biaya/pcs: <strong>{formatRupiah(costWithShip)}</strong></p>
          </div>
        </div>

        <div className="card" style={{ border: '2px solid #BBF7D0', background: '#F0FDF4' }}>
          <p style={{ fontSize: 11, color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Saran Harga Jual Reseller</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: '#059669', margin: '6px 0 0' }}>{formatRupiah(consumerPrice)}</p>
          <p style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>
            Reseller bisa jual dengan margin <strong>{resellerMarginPct}%</strong>
          </p>

          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Pilih margin reseller:</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {MARGIN_PRESETS.map(m => (
                <button
                  key={m}
                  onClick={() => setResellerMargin(String(m))}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: '1.5px solid',
                    borderColor: resellerMarginPct === m ? '#059669' : '#D1D5DB',
                    background: resellerMarginPct === m ? '#D1FAE5' : '#fff',
                    color: resellerMarginPct === m ? '#065F46' : '#64748B',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all .12s',
                    fontFamily: 'inherit',
                  }}
                >
                  {m}%
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Kustom:</span>
              <input
                type="number"
                value={resellerMargin}
                onChange={e => setResellerMargin(e.target.value)}
                min={0}
                max={99}
                placeholder="20"
                style={{
                  width: 70,
                  padding: '6px 10px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: 'center',
                  outline: 'none',
                  fontFamily: 'inherit',
                  background: '#fff',
                }}
              />
              <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>%</span>
            </div>
          </div>

          {resellerPrice > 0 && (
            <div style={{ marginTop: 14, padding: 10, background: '#fff', borderRadius: 8 }}>
              <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>
                Harga ke Reseller: <strong>{formatRupiah(resellerPrice)}</strong>
              </p>
              <p style={{ fontSize: 11, color: '#64748B', margin: '3px 0 0' }}>
                Harga Jual Konsumen: <strong style={{ color: '#059669' }}>{formatRupiah(consumerPrice)}</strong>
              </p>
              <p style={{ fontSize: 11, color: '#64748B', margin: '3px 0 0' }}>
                Profit Reseller/pcs: <strong style={{ color: resellerMarginVal < 100 ? '#10B981' : '#EF4444' }}>{formatRupiah(consumerPrice - resellerPrice)}</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 8 }}>Simulasi Harga Manual</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <NumInput value={manualPrice} onChange={setManualPrice} placeholder="Harga yg kamu mau jual ke reseller" />
          </div>
          {manualVal > 0 && (
            <>
              <div style={{ padding: '8px 16px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>Profit/unit</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: manualProfit >= 0 ? '#059669' : '#DC2626', margin: '2px 0 0' }}>
                  {formatRupiah(manualProfit)}
                </p>
              </div>
              <div style={{ padding: '8px 16px', background: '#EEF2FF', borderRadius: 8, border: '1px solid #C7D2FE' }}>
                <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>Margin</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#4338CA', margin: '2px 0 0' }}>
                  {manualMargin.toFixed(1)}%
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
