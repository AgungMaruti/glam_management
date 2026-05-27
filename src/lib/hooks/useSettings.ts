'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { settingsDb, balanceDb } from '@/lib/db'
import type { InitialBalance } from '@/types'
import { useToast } from '@/components/ui/Toaster'

export function useSettings() {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast })
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [balance, setBalance] = useState<InitialBalance | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [s, b] = await Promise.all([settingsDb.getAll(), balanceDb.get()])
      setSettings(s)
      setBalance(b)
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

  const setInitialBalance = async (amount: number) => {
    await balanceDb.set(amount)
    setBalance({ amount, user_id: balance?.user_id || '', id: balance?.id || '', set_at: new Date().toISOString() })
    toastRef.current({ title: 'Saldo awal disimpan', variant: 'success' })
  }

  return { settings, balance, loading, setSetting, setInitialBalance, refetch: fetch }
}
