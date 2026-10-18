import { Checkbox } from '@/components/ui/checkbox'
import { useNftSearch } from '@/features/discovery/useNftSearch'

const NETWORKS = ['Ethereum', 'Polygon', 'Solana'] as const

interface NetworkFilterProps {
  counts: Record<string, number>
}

/**
 * Lista de checkboxes das 3 redes suportadas, com a contagem (facet) ao
 * lado de cada uma. Mesma mecânica de `CategoryFilter`, mas para
 * `search.networks`.
 */
export function NetworkFilter({ counts }: NetworkFilterProps) {
  const { search, setSearch } = useNftSearch()
  const selected = search.networks ?? []

  const toggle = (network: string, checked: boolean) => {
    const next = checked ? [...selected, network] : selected.filter((n) => n !== network)
    setSearch({ networks: next.length > 0 ? next : undefined })
  }

  return (
    <fieldset data-testid="network-filter" className="flex flex-col gap-3">
      <legend className="mb-1 text-caption font-medium uppercase tracking-wide text-text-primary">
        Rede
      </legend>
      {NETWORKS.map((network) => {
        const id = `network-${network}`
        return (
          <div key={network} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={selected.includes(network)}
                onCheckedChange={(checked) => toggle(network, checked === true)}
              />
              <label htmlFor={id} className="cursor-pointer text-body text-text-primary">
                {network}
              </label>
            </div>
            <span className="text-caption text-text-secondary">{counts[network] ?? 0}</span>
          </div>
        )
      })}
    </fieldset>
  )
}
