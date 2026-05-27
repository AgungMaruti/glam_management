'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { materialsDb } from '@/lib/db'
import type { RawMaterial } from '@/types'
import { useToast } from '@/components/ui/Toaster'

export function useMaterials() {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast })
  const [data, setData] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try { setData(await materialsDb.getAll()) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setLoading(false) }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const create = async (p: Parameters<typeof materialsDb.create>[0]) => {
    setSaving(true)
    try { await materialsDb.create(p); await fetch(); toastRef.current({ title: 'Bahan ditambahkan', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setSaving(false) }
  }

  const update = async (id: string, p: Parameters<typeof materialsDb.update>[1]) => {
    setSaving(true)
    try { await materialsDb.update(id, p); await fetch(); toastRef.current({ title: 'Bahan diupdate', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    try { await materialsDb.remove(id); await fetch(); toastRef.current({ title: 'Bahan dihapus', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
  }

  const restock = async (p: Parameters<typeof materialsDb.restock>[0]) => {
    setSaving(true)
    try { await materialsDb.restock(p); await fetch(); toastRef.current({ title: 'Restock berhasil', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setSaving(false) }
  }

  return { data, loading, saving, create, update, remove, restock, refetch: fetch }
}
