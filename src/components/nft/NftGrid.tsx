import type { Nft } from '@/contracts/nft'
import { NftCard } from '@/components/nft/NftCard'
import { NftCardSkeleton } from '@/components/nft/NftCardSkeleton'

const SKELETON_COUNT = 12

/**
 * Grade responsiva do catálogo: 1 coluna no mobile, 2 no tablet, 3-4 no
 * desktop. Quando `isLoading`, renderiza N skeletons (mesma quantidade do
 * `pageSize` padrão) no lugar dos itens — sem misturar os dois estados.
 */
export function NftGrid({ items, isLoading }: { items: Nft[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <NftCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <NftCard key={item.id} item={item} />
      ))}
    </div>
  )
}
