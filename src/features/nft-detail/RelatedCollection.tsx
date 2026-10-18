import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/http/axios'
import { listNftsResponseSchema } from '@/contracts/nft'
import { NftCard } from '@/components/nft/NftCard'
import { NftCardSkeleton } from '@/components/nft/NftCardSkeleton'

interface RelatedCollectionProps {
  collection: string
  excludeId: string
}

/**
 * "Mais desta coleção": busca uma página do catálogo e filtra no cliente
 * pela mesma `collection`, excluindo o NFT atual. Não há parâmetro de
 * filtro por `collection` no contrato de listagem (`listNftsParamsSchema`
 * só tem `category`/`categories`/`networks`/preço/busca) — pedir uma
 * página maior e filtrar localmente é a abordagem mais simples sem
 * expandir o contrato REST nesta camada.
 */
export function RelatedCollection({ collection, excludeId }: RelatedCollectionProps) {
  const query = useQuery({
    queryKey: ['nfts', 'related', collection],
    queryFn: async () => {
      const { data } = await api.get('/nfts', { params: { pageSize: 60, page: 1 } })
      return listNftsResponseSchema.parse(data)
    },
  })

  const related = (query.data?.items ?? []).filter(
    (item) => item.collection === collection && item.id !== excludeId,
  )

  if (query.isLoading) {
    return (
      <section aria-label="Mais desta coleção" className="flex flex-col gap-4">
        <h2 className="text-heading text-text-primary">Mais desta coleção</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <NftCardSkeleton key={i} />
          ))}
        </div>
      </section>
    )
  }

  if (related.length === 0) {
    return null
  }

  return (
    <section aria-label="Mais desta coleção" className="flex flex-col gap-4">
      <h2 className="text-heading text-text-primary">Mais desta coleção</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {related.slice(0, 8).map((item) => (
          <NftCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
