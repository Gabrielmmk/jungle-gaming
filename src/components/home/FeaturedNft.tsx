import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/http/axios'
import { listNftsResponseSchema } from '@/contracts/nft'
import { formatEth } from '@/shared/eth/money'
import { Button } from '@/components/ui/button'

/**
 * Banner "NFT em destaque". A API mock não tem um endpoint dedicado para
 * o item `featured`, então buscamos uma página grande o suficiente para
 * conter o seed inteiro e filtramos no cliente — simples e suficiente
 * para este catálogo de tamanho fixo, sem introduzir um novo contrato de
 * API só para isso. Consulta própria (não reaproveita `useNfts`/a busca
 * do usuário) porque este banner é independente dos filtros do catálogo.
 */
export function FeaturedNft() {
  const { data } = useQuery({
    queryKey: ['nfts', 'featured-lookup'],
    queryFn: async () => {
      const { data } = await api.get('/nfts', { params: { page: 1, pageSize: 60 } })
      return listNftsResponseSchema.parse(data)
    },
  })

  const featured = data?.items.find((item) => item.featured)

  if (!featured) return null

  return (
    <div className="hidden flex-col gap-3 rounded-lg border border-primary bg-surface-card p-4 md:flex">
      <div>
        <p className="text-caption font-semibold uppercase tracking-wide text-text-primary">
          NFT em destaque
        </p>
        <p className="text-caption font-medium uppercase tracking-[0.15em] text-text-accent">
          Oferta limitada
        </p>
      </div>

      <div className="aspect-square w-full overflow-hidden rounded-md border border-border-soft">
        <img
          src={featured.image}
          alt={`${featured.name} — ${featured.collection}`}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="truncate text-body-lg font-medium text-text-primary">{featured.name}</h3>
        <p className="text-body font-medium text-text-accent">{formatEth(featured.priceEth)}</p>
      </div>

      <Button asChild variant="outline" size="sm">
        <Link to="/nft/$id" params={{ id: featured.id }}>
          Ver detalhes
        </Link>
      </Button>
    </div>
  )
}
