import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { useNftSearch } from '@/features/discovery/useNftSearch'

const PRICE_MIN = 0
const PRICE_MAX = 10

function rangeFromSearch(minPrice?: string, maxPrice?: string): [number, number] {
  return [minPrice ? Number(minPrice) : PRICE_MIN, maxPrice ? Number(maxPrice) : PRICE_MAX]
}

/**
 * Filtro de faixa de preço. O slider é um rascunho local — só quando o
 * usuário clica "Aplicar" é que `setSearch({ minPrice, maxPrice })` é
 * chamado, evitando uma navegação por cada pixel arrastado. Os valores
 * viajam como string decimal (contrato combinado com `NftSearch`).
 *
 * Sincroniza com a URL ajustando o estado local durante a renderização
 * (padrão React de "adjusting state when a prop changes", guardando o
 * último valor externo visto em `useState` em vez de `useRef` — o lint
 * do projeto proíbe mutar refs durante a renderização) quando
 * `minPrice`/`maxPrice` mudam por fora (ex.: "limpar filtros").
 */
export function PriceFilter() {
  const { search, setSearch } = useNftSearch()
  const externalKey = `${search.minPrice ?? ''}|${search.maxPrice ?? ''}`

  const [range, setRange] = useState<[number, number]>(() =>
    rangeFromSearch(search.minPrice, search.maxPrice),
  )
  const [lastExternalKey, setLastExternalKey] = useState(externalKey)

  if (lastExternalKey !== externalKey) {
    setLastExternalKey(externalKey)
    setRange(rangeFromSearch(search.minPrice, search.maxPrice))
  }

  const apply = () => {
    setSearch({
      minPrice: range[0] > PRICE_MIN ? range[0].toFixed(2) : undefined,
      maxPrice: range[1] < PRICE_MAX ? range[1].toFixed(2) : undefined,
    })
  }

  return (
    <div data-testid="price-filter" className="flex flex-col gap-3">
      <p className="text-caption font-medium uppercase tracking-wide text-text-primary">
        Faixa de preço
      </p>
      <Slider
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={0.1}
        value={range}
        onValueChange={(value) => setRange([value[0], value[1]] as [number, number])}
        aria-label="Faixa de preço em ETH"
      />
      <div className="flex items-center justify-between text-caption text-text-secondary">
        <span>{range[0].toFixed(2)} ETH</span>
        <span>{range[1].toFixed(2)} ETH</span>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={apply}>
        Aplicar
      </Button>
    </div>
  )
}
