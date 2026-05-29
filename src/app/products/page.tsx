'use client'
import { Package } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useProducts, useResellers } from '@/lib/hooks'
import { salesDb, distributionsDb } from '@/lib/db'
import { ProductList } from '@/components/features/products/ProductList'
import { useAppStore } from '@/store'
import { useToast } from '@/components/ui/Toaster'

export default function ProductsPage() {
  const products = useProducts()
  const resellers = useResellers()
  const trigger = useAppStore(s => s.triggerDashboardRefresh)
  const { toast } = useToast()

  const handleSale = async (p: Parameters<typeof salesDb.recordSale>[0]) => {
    try {
      await salesDb.recordSale(p)
      trigger()
    } catch (e: unknown) { toast({ title: (e as Error).message, variant: 'error' }) }
  }
  const handleDistribute = async (p: Parameters<typeof distributionsDb.distribute>[0]) => {
    try {
      await distributionsDb.distribute(p)
      trigger()
    } catch (e: unknown) { toast({ title: (e as Error).message, variant: 'error' }) }
  }
  const handlePayment = async (p: Parameters<typeof resellers.recordPayment>[0]) => {
    try {
      await resellers.recordPayment(p)
      trigger()
    } catch (e: unknown) { toast({ title: (e as Error).message, variant: 'error' }) }
  }

  return (
    <>
      <PageHeader icon={Package} title="Produk & Varian" />
      <ProductList
        products={products.data}
        resellers={resellers.data}
        distributions={[]}
        loading={products.loading}
        saving={products.saving}
        onCreateProduct={products.createProduct}
        onUpdateProduct={products.updateProduct}
        onDeleteProduct={products.removeProduct}
        onCreateVariant={products.createVariant}
        onUpdateVariant={products.updateVariant}
        onDeleteVariant={products.removeVariant}
        onSale={handleSale}
        onDistribute={handleDistribute}
        onResellerPayment={handlePayment}
        onCreateReseller={resellers.createOrGet}
      />
    </>
  )
}
