import { useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useNftSearch } from '@/features/discovery/useNftSearch'

const DEBOUNCE_MS = 300

/**
 * Campo de busca textual do catálogo. Mantém um valor local para digitar
 * sem travar a UI, e só propaga para a URL (via `setSearch`) depois de
 * `DEBOUNCE_MS` sem novas teclas — evita uma navegação por tecla digitada.
 *
 * Sincroniza com `search.q` quando ele muda por fora (ex.: "limpar
 * filtros", navegação back/forward) ajustando o estado local durante a
 * renderização (padrão React de "adjusting state when a prop changes",
 * guardando o último valor externo visto em `useState` em vez de
 * `useRef` — o lint do projeto proíbe mutar refs durante a renderização).
 */
export function SearchBox() {
  const { search, setSearch } = useNftSearch()
  const externalQ = search.q ?? ''

  const [value, setValue] = useState(externalQ)
  const [lastExternalQ, setLastExternalQ] = useState(externalQ)

  if (lastExternalQ !== externalQ) {
    setLastExternalQ(externalQ)
    setValue(externalQ)
  }

  const debounceHandle = useRef<ReturnType<typeof setTimeout>>()

  const handleChange = (next: string) => {
    setValue(next)
    setLastExternalQ(externalQ) // evita que a reconciliação acima sobrescreva a digitação
    clearTimeout(debounceHandle.current)
    debounceHandle.current = setTimeout(() => {
      setSearch({ q: next || undefined })
    }, DEBOUNCE_MS)
  }

  return (
    <form role="search" className="relative w-full" onSubmit={(e) => e.preventDefault()}>
      <label htmlFor="nft-search" className="sr-only">
        Buscar NFTs
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
      />
      <input
        id="nft-search"
        type="search"
        data-testid="search-input"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar NFTs, coleções..."
        className="w-full rounded-md border border-border-soft bg-surface-card py-2 pl-9 pr-3 text-body text-text-primary placeholder:text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      />
    </form>
  )
}
