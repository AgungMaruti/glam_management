'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { settingsDb } from '@/lib/db'
import { useToast } from '@/components/ui/Toaster'

export function useSettings() {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast })
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const s = await settingsDb.getAll()
      setSettings(s)
    }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setLoading(false) }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const setSetting = async (key: string, value: string) => {
    await settingsDb.set(key, value)
    setSettings(prev => ({ ...prev, [key]: value }))
    toastRef.current({ title: 'Pengaturan disimpan', variant: 'success' })
  }

  return { settings, loading, setSetting, refetch: fetch }
}
