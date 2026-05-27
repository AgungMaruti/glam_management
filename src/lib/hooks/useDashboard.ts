'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { dashboardDb } from '@/lib/db'
import type { DashboardMetrics, PiutangReseller, ProductSalesData, CashflowMonthlyData, RawMaterial } from '@/types'
import { useToast } from '@/components/ui/Toaster'

export function useDashboard() {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast })
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [piutang, setPiutang] = useState<PiutangReseller[]>([])
  const [productSales, setProductSales] = useState<ProductSalesData[]>([])
  const [cashflowTrend, setCashflowTrend] = useState<CashflowMonthlyData[]>([])
  const [criticalMaterials, setCriticalMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [m, p, ps, ct, cm] = await Promise.all([
        dashboardDb.getMetrics(),
        dashboardDb.getPiutang(),
        dashboardDb.getProductSales(),
        dashboardDb.getCashflowTrend(),
        dashboardDb.getCriticalMaterials(),
      ])
      setMetrics(m)
      setPiutang(p)
      setProductSales(ps)
      setCashflowTrend(ct)
      setCriticalMaterials(cm)
    }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setLoading(false) }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  return { metrics, piutang, productSales, cashflowTrend, criticalMaterials, loading, refetch: fetch }
}
