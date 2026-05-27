'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { resellersDb } from '@/lib/db'
import type { Reseller } from '@/types'
import { useToast } from '@/components/ui/Toaster'

export function useResellers() {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast })
  const [data, setData] = useState<Reseller[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try { setData(await resellersDb.getAll()) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setLoading(false) }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const createOrGet = async (name: string): Promise<Reseller> => {
    const r = await resellersDb.createOrGet(name)
    await fetch()
    return r
  }

  const recordPayment = async (p: Parameters<typeof resellersDb.recordPayment>[0]) => {
    setSaving(true)
    try { await resellersDb.recordPayment(p); await fetch(); toastRef.current({ title: 'Pembayaran dicatat', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setSaving(false) }
  }

  return { data, loading, saving, createOrGet, recordPayment, refetch: fetch }
}
