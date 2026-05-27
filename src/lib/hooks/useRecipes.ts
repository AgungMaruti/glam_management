'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { recipesDb } from '@/lib/db'
import type { Recipe, RawMaterial, Variant } from '@/types'
import { useToast } from '@/components/ui/Toaster'

export function useRecipes() {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast })
  const [data, setData] = useState<(Variant & { recipes: (Recipe & { raw_material: RawMaterial })[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try { setData(await recipesDb.getAllByVariant()) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setLoading(false) }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const create = async (p: Parameters<typeof recipesDb.create>[0]) => {
    setSaving(true)
    try { await recipesDb.create(p); await fetch(); toastRef.current({ title: 'Resep ditambahkan', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    try { await recipesDb.remove(id); await fetch(); toastRef.current({ title: 'Resep dihapus', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
  }

  return { data, loading, saving, create, remove, refetch: fetch }
}
