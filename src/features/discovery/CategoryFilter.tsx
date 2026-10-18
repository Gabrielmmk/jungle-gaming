import { Checkbox } from '@/components/ui/checkbox'
import { useNftSearch } from '@/features/discovery/useNftSearch'

const CATEGORIES = [
  'Digital Art',
  'Photography',
  'Music',
  '3D Art',
  'Collectibles',
  'Generative',
  'Gaming',
  'Memberships',
] as const

interface CategoryFilterProps {
  counts: Record<string, number>
}

/**
 * Lista de checkboxes das 8 categorias fixas, com a contagem (facet) ao
 * lado de cada uma. Marcar/desmarcar atualiza `search.categories` como
 * array — ao tocar um filtro, `useNftSearch` já reseta `page` para 1.
 */
export function CategoryFilter({ counts }: CategoryFilterProps) {
  const { search, setSearch } = useNftSearch()
  const selected = search.categories ?? []

  const toggle = (category: string, checked: boolean) => {
    const next = checked ? [...selected, category] : selected.filter((c) => c !== category)
    setSearch({ categories: next.length > 0 ? next : undefined })
  }

  return (
    <fieldset data-testid="category-filter" className="flex flex-col gap-3">
      <legend className="mb-1 text-caption font-medium uppercase tracking-wide text-text-primary">
        Coleções
      </legend>
      {CATEGORIES.map((category) => {
        const id = `category-${category}`
        return (
          <div key={category} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={selected.includes(category)}
                onCheckedChange={(checked) => toggle(category, checked === true)}
              />
              <label htmlFor={id} className="cursor-pointer text-body text-text-primary">
                {category}
              </label>
            </div>
            <span className="text-caption text-text-secondary">{counts[category] ?? 0}</span>
          </div>
        )
      })}
    </fieldset>
  )
}
