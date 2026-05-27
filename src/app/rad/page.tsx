'use client'
import { Calculator } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useRad } from '@/lib/hooks'
import { RadList } from '@/components/features/rad/RadList'

export default function RadPage() {
  const rad = useRad()

  return (
    <>
      <PageHeader icon={Calculator} title="RAD & HPP" />
      <RadList data={rad.data} loading={rad.loading} saving={rad.saving} onCreate={rad.create} onRemove={rad.remove} />
    </>
  )
}
