import type { Nft } from '@/contracts/nft'
import { NftCard } from '@/components/nft/NftCard'
import { NftCardSkeleton } from '@/components/nft/NftCardSkeleton'

const SKELETON_COUNT = 12

/**
 * Grade responsiva do catálogo: 1 coluna no mobile, 2 no tablet, 3-4 no
 * desktop. Quando `isLoading`, renderiza N skeletons (mesma quantidade do
 * `pageSize` padrão) no lugar dos itens — sem misturar os dois estados.
 *
 * `mobileCard`: variante da Início (ver `NftCard`) — também muda a grade
 * para 2 colunas já no mobile (em vez de 1), fiel ao Figma dessa tela.
 */
export function NftGrid({
  items,
  isLoading,
  mobileCard = false,
}: {
  items: Nft[]
  isLoading: boolean
  mobileCard?: boolean
}) {
  const gridClassName = `grid gap-6 lg:grid-cols-3 ${mobileCard ? 'grid-cols-2 gap-4 sm:gap-6' : 'grid-cols-1 sm:grid-cols-2'}`

  if (isLoading) {
    return (
      <div className={gridClassName}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <NftCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className={gridClassName}>
      {items.map((item) => (
        <NftCard key={item.id} item={item} mobileCard={mobileCard} />
      ))}
    </div>
  )
}
