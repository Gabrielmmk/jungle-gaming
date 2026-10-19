import { SlidersHorizontal } from 'lucide-react'
import { SearchBox } from '@/features/discovery/SearchBox'

/**
 * Topo mobile da Início (Figma): busca + botão de filtro, no lugar do
 * header padrão (oculto nesta tela só no mobile — ver `IndexPage`). O
 * botão de filtro abre o mesmo Sheet de `FiltersPanel` (estado controlado
 * pelo `IndexPage`, que também oculta o gatilho "Filtros" embutido no
 * catálogo — evita duas entradas para o mesmo drawer).
 */
export function MobileTopBar({ onFilterClick }: { onFilterClick: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4 md:hidden">
      <div className="flex-1">
        <SearchBox placeholder="Explorar coleções" />
      </div>
      <button
        type="button"
        onClick={onFilterClick}
        aria-label="Abrir filtros do catálogo"
        className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <SlidersHorizontal aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}
