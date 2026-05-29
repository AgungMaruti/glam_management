'use client'
import StatCard from '@/components/ui/StatCard'
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import type { DashboardMetrics } from '@/types'

interface StatsCardsProps {
  metrics: DashboardMetrics | null
}

export function StatsCards({ metrics }: StatsCardsProps) {
  return (
    <div className="stats-grid">
      <StatCard icon={Wallet} title="Saldo" value={metrics ? formatRupiah(metrics.saldo) : '—'} color="indigo" />
      <StatCard icon={TrendingUp} title="Total Pemasukan" value={metrics ? formatRupiah(metrics.total_income_all) : '—'} color="green" />
      <StatCard icon={TrendingDown} title="Total Pengeluaran" value={metrics ? formatRupiah(metrics.total_expense_all) : '—'} color="amber" />
      <StatCard icon={AlertTriangle} title="Stok Kritis" value={metrics ? String(metrics.critical_stock_count) : '—'} subtitle="bahan" color={metrics && metrics.critical_stock_count > 0 ? 'red' : 'green'} />
    </div>
  )
}
