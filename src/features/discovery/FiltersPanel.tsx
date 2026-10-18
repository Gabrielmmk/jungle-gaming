import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { CategoryFilter } from '@/features/discovery/CategoryFilter'
import { NetworkFilter } from '@/features/discovery/NetworkFilter'
import { PriceFilter } from '@/features/discovery/PriceFilter'
import type { Facets } from '@/contracts/nft'

interface FiltersPanelProps {
  facets: Facets
}

/**
 * Corpo dos filtros (compartilhado entre a versão fixa no desktop e o
 * drawer mobile), para não duplicar o JSX das três seções.
 */
function FiltersBody({ facets }: FiltersPanelProps) {
  return (
    <div className="flex flex-col gap-8">
      <CategoryFilter counts={facets.categories} />
      <PriceFilter />
      <NetworkFilter counts={facets.networks} />
    </div>
  )
}

/**
 * Painel de filtros do catálogo. No desktop (`md:` e acima) é uma coluna
 * fixa lateral; no mobile fica dentro de um `Sheet` (drawer) com
 * focus trap (herdado do Radix Dialog) e um botão "Filtros" que o abre.
 */
export function FiltersPanel({ facets }: FiltersPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <aside
        data-testid="filters-panel"
        className="hidden w-64 shrink-0 rounded-lg border border-border-soft bg-surface-card p-5 md:block"
      >
        <FiltersBody facets={facets} />
      </aside>

      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" data-testid="filters-trigger">
              <SlidersHorizontal className="size-4" />
              Filtros
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <FiltersBody facets={facets} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
