'use client'
import { useState } from 'react'
import { PiggyBank, Wallet, TrendingUp, Percent, Edit2 } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import NumInput from '@/components/ui/NumInput'
import StatCard from '@/components/ui/StatCard'
import type { DashboardMetrics } from '@/types'

interface ProfitTrackerProps {
  metrics: DashboardMetrics | null
  settings: Record<string, string>
  onSetModal: (key: string, value: string) => Promise<void>
}

export function ProfitTracker({ metrics, settings, onSetModal }: ProfitTrackerProps) {
  const [showModal, setShowModal] = useState(false)
  const [modalDraft, setModalDraft] = useState('')

  const modal = Number(settings['modal_bisnis'] || '0')
  const saldo = metrics?.saldo ?? 0
  const profit = metrics?.profit_bersih ?? 0
  const roi = metrics?.roi ?? 0
  const gaji = metrics?.gaji_bulan ?? 0
  const marketing = metrics?.marketing_bulan ?? 0
  const operasional = metrics?.operasional_bulan ?? 0
  const bep = metrics?.bep_botol ?? 0

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>Modal & Profit Tracker</h3>
        {modal > 0 ? (
          <Button variant="outline" size="sm" icon={Edit2} onClick={() => { setModalDraft(String(modal)); setShowModal(true) }}>
            Edit Modal
          </Button>
        ) : (
          <Button variant="primary" size="sm" icon={Edit2} onClick={() => { setModalDraft(''); setShowModal(true) }}>
            Set Modal Awal
          </Button>
        )}
      </div>

      <div className="three-col" style={{ margin: 0 }}>
        <StatCard icon={PiggyBank} title="Total Modal Ditanam" value={modal > 0 ? formatRupiah(modal) : '—'} color="violet" />
        <StatCard icon={Wallet} title="Kas Bisnis Saat Ini" value={metrics ? formatRupiah(saldo) : '—'} color="indigo" />
      </div>
      <div className="three-col" style={{ marginTop: 12 }}>
        <StatCard icon={TrendingUp} title="Profit Bersih" value={metrics ? formatRupiah(profit) : '—'} color={profit >= 0 ? 'green' : 'red'} />
        <StatCard icon={Percent} title="ROI" value={metrics ? `${roi.toFixed(1)}%` : '—'} color="violet" />
      </div>

      {bep > 0 && (
        <div className="card" style={{ marginTop: 16, border: '1px dashed #6366F1', background: '#EEF2FF' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#4338CA' }}>
            BEP Bulan Ini: <strong>{bep} botol</strong>
          </p>
          <p style={{ fontSize: 12, color: '#6366F1', marginTop: 4 }}>
            Untuk menutup biaya tetap (gaji + marketing + operasional) bulan ini: {formatRupiah(gaji + marketing + operasional)}
          </p>
        </div>
      )}

      <Modal open={showModal} title={modal > 0 ? 'Edit Modal Bisnis' : 'Set Modal Awal'} size="sm" onClose={() => setShowModal(false)}>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
          Total uang yang sudah kamu investasikan ke bisnis ini sejak awal (beli bahan, peralatan, dll).
        </p>
        <NumInput value={modalDraft} onChange={setModalDraft} placeholder="Masukkan total modal" />
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Batal</Button>
          <Button variant="primary" loading={false} onClick={async () => {
            const val = String(parseFloat(modalDraft.replace(/\D/g, '')) || 0)
            await onSetModal('modal_bisnis', val)
            setShowModal(false)
          }}>
            Simpan
          </Button>
        </div>
      </Modal>
    </div>
  )
}
