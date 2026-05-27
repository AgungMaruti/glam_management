'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { cashflowDb } from '@/lib/db'
import type { Cashflow } from '@/types'
import { useToast } from '@/components/ui/Toaster'

export function useCashflow() {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast })
  const [data, setData] = useState<Cashflow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await cashflowDb.getAll({ period, page, limit })
      setData(result.data)
      setTotal(result.count)
    }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setLoading(false) }
  }, [period, page])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const addTransaction = async (p: Parameters<typeof cashflowDb.addTransaction>[0]) => {
    setSaving(true)
    try { await cashflowDb.addTransaction(p); setPage(1); toastRef.current({ title: 'Transaksi ditambahkan', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    try { await cashflowDb.remove(id); await fetch(); toastRef.current({ title: 'Transaksi dihapus', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
  }

  return { data, loading, saving, period, page, total, limit, setPeriod, setPage, addTransaction, remove, refetch: fetch }
}
