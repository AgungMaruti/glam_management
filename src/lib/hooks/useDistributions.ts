'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { distributionsDb } from '@/lib/db'
import type { Distribution } from '@/types'
import { useToast } from '@/components/ui/Toaster'

export function useDistributions() {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast })
  const [data, setData] = useState<Distribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try { setData(await distributionsDb.getAll()) }
    catch (e: unknown) {
      const msg = (e as Error).message
      setError(msg)
      toastRef.current({ title: msg, variant: 'error' })
    }
    finally { setLoading(false) }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
