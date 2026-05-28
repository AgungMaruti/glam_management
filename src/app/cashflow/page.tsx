'use client'
import { Wallet } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useCashflow } from '@/lib/hooks'
import { TransactionList } from '@/components/features/cashflow/TransactionList'
import { useAppStore } from '@/store'

export default function CashflowPage() {
  const cashflow = useCashflow()
  const trigger = useAppStore(s => s.triggerDashboardRefresh)

  const handleAdd = async (p: Parameters<typeof cashflow.addTransaction>[0]) => {
    await cashflow.addTransaction(p)
    trigger()
  }

  return (
    <>
      <PageHeader icon={Wallet} title="Cashflow" />
      <TransactionList
        data={cashflow.data}
        period={cashflow.period}
        page={cashflow.page}
        total={cashflow.total}
        limit={cashflow.limit}
        loading={cashflow.loading}
        saving={cashflow.saving}
        onPeriodChange={cashflow.setPeriod}
        onPageChange={cashflow.setPage}
        onAdd={handleAdd}
        onRemove={cashflow.remove}
      />
    </>
  )
}
