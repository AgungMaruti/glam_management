'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { radDb } from '@/lib/db'
import type { Rad, RadItem } from '@/types'
import { useToast } from '@/components/ui/Toaster'

export function useRad() {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast })
  const [data, setData] = useState<(Rad & { items: RadItem[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try { setData(await radDb.getAll()) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setLoading(false) }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const create = async (p: Parameters<typeof radDb.create>[0]) => {
    setSaving(true)
    try { await radDb.create(p); await fetch(); toastRef.current({ title: 'RAD dibuat', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    try { await radDb.remove(id); await fetch(); toastRef.current({ title: 'RAD dihapus', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
  }

  return { data, loading, saving, create, remove, refetch: fetch }
}
