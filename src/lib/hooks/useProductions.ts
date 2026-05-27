'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { productionsDb } from '@/lib/db'
import type { Production, Variant } from '@/types'
import { useToast } from '@/components/ui/Toaster'

export function useProductions() {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast })
  const [data, setData] = useState<(Production & { variant: Variant })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 15

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await productionsDb.getAll(page, limit)
      setData(result.data)
      setTotal(result.count)
    }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setLoading(false) }
  }, [page])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const run = async (p: Parameters<typeof productionsDb.run>[0]) => {
    setSaving(true)
    try { await productionsDb.run(p); setPage(1); toastRef.current({ title: `Produksi ${p.quantity} pcs berhasil`, variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setSaving(false) }
  }

  return { data, loading, saving, page, total, limit, setPage, run, refetch: fetch }
}
