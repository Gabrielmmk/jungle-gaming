import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNftSearch } from '@/features/discovery/useNftSearch'
import type { NftSearch } from '@/features/discovery/useNftSearch'

type SortValue = NonNullable<NftSearch['sort']>

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'price_asc', label: 'Preço: menor para maior' },
  { value: 'price_desc', label: 'Preço: maior para menor' },
]

/**
 * Seletor de ordenação do catálogo. O valor atual vem da URL
 * (`search.sort`); por padrão (sem valor na URL) mostramos "recent" como
 * seleção visual, mas só escrevemos na URL quando o usuário escolhe algo.
 */
export function SortSelect() {
  const { search, setSearch } = useNftSearch()
  const current: SortValue = search.sort ?? 'recent'

  return (
    <Select value={current} onValueChange={(value: SortValue) => setSearch({ sort: value })}>
      <SelectTrigger data-testid="sort-select" aria-label="Ordenar por" className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
