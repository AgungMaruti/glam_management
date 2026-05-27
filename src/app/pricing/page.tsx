'use client'
import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { EcommerceTab } from '@/components/features/pricing/EcommerceTab'
import { ResellerTab } from '@/components/features/pricing/ResellerTab'

export default function PricingPage() {
  const [tab, setTab] = useState<'ecommerce' | 'reseller'>('ecommerce')
  return (
    <>
      <PageHeader icon={ShoppingCart} title="Kalkulator Harga" />
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        {([['ecommerce', 'E-Commerce'], ['reseller', 'Reseller']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`tab-item${tab === t ? ' active' : ''}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'ecommerce' ? <EcommerceTab /> : <ResellerTab />}
    </>
  )
}
