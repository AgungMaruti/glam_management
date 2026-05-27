'use client'
import { useEffect, useState } from 'react'
import { LayoutDashboard } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { dashboardDb } from '@/lib/db'
import { settingsDb } from '@/lib/db'
import { useAppStore } from '@/store'
import { StatsCards } from '@/components/features/dashboard/StatsCards'
import { ProfitTracker } from '@/components/features/dashboard/ProfitTracker'
import { DashboardCharts } from '@/components/features/dashboard/DashboardCharts'
import type { DashboardMetrics, ProductSalesData, CashflowMonthlyData, RawMaterial } from '@/types'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [productSales, setProductSales] = useState<ProductSalesData[]>([])
  const [cashflowTrend, setCashflowTrend] = useState<CashflowMonthlyData[]>([])
  const [criticalMaterials, setCriticalMaterials] = useState<RawMaterial[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const version = useAppStore(s => s.dashboardVersion)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [m, ps, ct, cm, s] = await Promise.all([
          dashboardDb.getMetrics(),
          dashboardDb.getProductSales(),
          dashboardDb.getCashflowTrend(),
          dashboardDb.getCriticalMaterials(),
          settingsDb.getAll(),
        ])
        if (cancelled) return
        setMetrics(m)
        setProductSales(ps)
        setCashflowTrend(ct)
        setCriticalMaterials(cm)
        setSettings(s)
      } catch { /* silently fail */ }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [version])

  if (loading) {
    return (
      <>
        <PageHeader icon={LayoutDashboard} title="Dashboard" />
        <p style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Memuat dashboard...</p>
      </>
    )
  }

  return (
    <>
      <PageHeader icon={LayoutDashboard} title="Dashboard" />
      <StatsCards metrics={metrics} />
      <ProfitTracker
        metrics={metrics}
        settings={settings}
        onSetModal={async (key, value) => {
          await settingsDb.set(key, value)
          setSettings(prev => ({ ...prev, [key]: value }))
        }}
      />
      <DashboardCharts productSales={productSales} cashflowTrend={cashflowTrend} />
      {criticalMaterials.length > 0 && (
        <div className="card" style={{ marginTop: 16, border: '2px solid #FCA5A5', background: '#FFF5F5' }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>Stok Bahan Kritis</h4>
          {criticalMaterials.map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #FEE2E2', fontSize: 13 }}>
              <span>{m.name}</span>
              <span style={{ fontWeight: 700, color: '#DC2626' }}>Stok: {m.stock} {m.unit} (min: {m.min_stock})</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
