'use client'
import { useState } from 'react'
import { Boxes } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useMaterials, useRecipes, useProductions } from '@/lib/hooks'
import { MaterialList } from '@/components/features/inventory/MaterialList'
import { RecipeList } from '@/components/features/inventory/RecipeList'
import { ProductionList } from '@/components/features/inventory/ProductionList'
import { useAppStore } from '@/store'

type Tab = 'materials' | 'recipe' | 'production'

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('materials')
  const materials = useMaterials()
  const recipes = useRecipes()
  const productions = useProductions()
  const trigger = useAppStore(s => s.triggerDashboardRefresh)

  return (
    <>
      <PageHeader icon={Boxes} title="Inventori" />
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        {([['materials', 'Bahan Baku'], ['recipe', 'Resep / BOM'], ['production', 'Produksi']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`tab-item${tab === t ? ' active' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'materials' && (
        <MaterialList
          materials={materials.data}
          loading={materials.loading}
          saving={materials.saving}
          onCreate={materials.create}
          onUpdate={materials.update}
          onRemove={materials.remove}
          onRestock={async (p) => { await materials.restock(p); trigger() }}
        />
      )}
      {tab === 'recipe' && (
        <RecipeList
          data={recipes.data}
          materials={materials.data}
          loading={recipes.loading}
          saving={recipes.saving}
          onCreate={recipes.create}
          onRemove={recipes.remove}
        />
      )}
      {tab === 'production' && (
        <ProductionList
          productions={productions.data}
          page={productions.page}
          total={productions.total}
          limit={productions.limit}
          loading={productions.loading}
          saving={productions.saving}
          onPageChange={productions.setPage}
          onRun={async (p) => { await productions.run(p); trigger() }}
          variants={recipes.data}
        />
      )}
    </>
  )
}
