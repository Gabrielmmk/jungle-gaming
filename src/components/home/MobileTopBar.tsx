import { SlidersHorizontal } from 'lucide-react'
import { SearchBox } from '@/features/discovery/SearchBox'
import { CATALOG_ANCHOR_ID } from '@/components/home/Hero'

/**
 * Topo mobile da Início (Figma): busca + botão de filtro, no lugar do
 * header padrão (oculto nesta tela só no mobile — ver `IndexPage`). O
 * botão de filtro leva até o painel de filtros do catálogo (`FiltersPanel`
 * já tem seu próprio gatilho "Filtros" lá — isto evita duplicar o Sheet).
 */
export function MobileTopBar() {
  const scrollToFilters = () => {
    document.getElementById(CATALOG_ANCHOR_ID)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex items-center gap-3 px-4 pt-4 md:hidden">
      <div className="flex-1">
        <SearchBox placeholder="Explorar coleções" />
      </div>
      <button
        type="button"
        onClick={scrollToFilters}
        aria-label="Ir para os filtros do catálogo"
        className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <SlidersHorizontal aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}
