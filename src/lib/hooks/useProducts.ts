'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { productsDb, variantsDb } from '@/lib/db'
import type { Product, Variant } from '@/types'
import { useToast } from '@/components/ui/Toaster'

export function useProducts() {
  const { toast } = useToast()
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast })
  const [data, setData] = useState<(Product & { variants: Variant[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const products = await productsDb.getAll()
      const stats = await variantsDb.getWithStats()
      const statMap: Record<string, { total_produced: number; total_sold: number }> = {}
      stats.forEach(s => { statMap[s.variant_id] = s })
      const enriched = products.map(p => ({
        ...p,
        variants: (p.variants || []).map(v => ({
          ...v,
          total_produced: statMap[v.id]?.total_produced || 0,
          total_sold: statMap[v.id]?.total_sold || 0,
        })),
      }))
      setData(enriched)
    }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setLoading(false) }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  const createProduct = async (name: string, description?: string) => {
    setSaving(true)
    try { await productsDb.create(name, description); await fetch(); toastRef.current({ title: 'Produk dibuat', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setSaving(false) }
  }

  const updateProduct = async (id: string, p: { name: string; description?: string }) => {
    setSaving(true)
    try { await productsDb.update(id, p); await fetch(); toastRef.current({ title: 'Produk diupdate', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setSaving(false) }
  }

  const removeProduct = async (id: string) => {
    try { await productsDb.remove(id); await fetch(); toastRef.current({ title: 'Produk dihapus', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
  }

  const createVariant = async (p: Parameters<typeof variantsDb.create>[0]) => {
    setSaving(true)
    try { await variantsDb.create(p); await fetch(); toastRef.current({ title: 'Varian ditambahkan', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setSaving(false) }
  }

  const updateVariant = async (id: string, p: Parameters<typeof variantsDb.update>[1]) => {
    setSaving(true)
    try { await variantsDb.update(id, p); await fetch(); toastRef.current({ title: 'Varian diupdate', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
    finally { setSaving(false) }
  }

  const removeVariant = async (id: string) => {
    try { await variantsDb.remove(id); await fetch(); toastRef.current({ title: 'Varian dihapus', variant: 'success' }) }
    catch (e: unknown) { toastRef.current({ title: (e as Error).message, variant: 'error' }) }
  }

  return {
    data, loading, saving,
    createProduct, updateProduct, removeProduct,
    createVariant, updateVariant, removeVariant,
    refetch: fetch,
  }
}
