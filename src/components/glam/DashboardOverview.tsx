'use client'
import { getProfit, getCashflow, getInventory, getRatios } from '@/lib/glam-ai'
import { useEffect, useState } from 'react'

interface DashboardData {
  profit?: { revenue?: number; netProfit?: number; netMargin?: number }
  cashflow?: { cashPosition?: number }
  inventory?: { variants?: { totalAvailable: number }[] }
  ratios?: { roi?: number; inventoryTurnover?: number; avgHpp?: number }
}

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    async function load() {
      const [profit, cashflow, inventory, ratios] = await Promise.all([
        getProfit(),
        getCashflow(),
        getInventory(),
        getRatios(),
      ])
      setData({ profit, cashflow, inventory, ratios })
    }
    load()
  }, [])

  if (!data) return <div className="text-center py-8 text-gray-400">Loading AI data...</div>

  const { profit, cashflow, inventory, ratios } = data
  const totalStok = inventory?.variants?.reduce((a, b) => a + (b.totalAvailable || 0), 0) ?? 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      <Card title="Revenue" value={profit?.revenue} format="rupiah" />
      <Card title="Net Profit" value={profit?.netProfit} format="rupiah" />
      <Card title="Margin" value={profit?.netMargin} format="percent" />
      <Card title="Kas" value={cashflow?.cashPosition} format="rupiah" />
      <Card title="Total Stok" value={totalStok} />
      <Card title="ROI" value={ratios?.roi} format="percent" />
      <Card title="Inventory Turnover" value={ratios?.inventoryTurnover} />
      <Card title="Avg HPP" value={ratios?.avgHpp} format="rupiah" />
    </div>
  )
}

function Card({ title, value, format }: { title: string; value?: number | null; format?: 'rupiah' | 'percent' }) {
  const display = format === 'rupiah'
    ? `Rp ${(value ?? 0).toLocaleString()}`
    : format === 'percent'
    ? `${(value ?? 0).toFixed(1)}%`
    : value ?? '-'

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-1">{display}</p>
    </div>
  )
}
