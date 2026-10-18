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
    <section className="border-y border-border bg-surface-card px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 md:flex-row">
        <div className="aspect-square w-full max-w-sm overflow-hidden rounded-lg border border-border-soft md:w-80">
          <img
            src={featured.image}
            alt={`${featured.name} — ${featured.collection}`}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col items-start gap-3 text-left">
          <p className="text-caption uppercase tracking-[0.2em] text-text-accent">
            NFT em destaque
          </p>
          <h2 className="text-heading font-semibold text-text-primary">{featured.name}</h2>
          <p className="text-body text-text-secondary">{featured.collection}</p>
          <p className="max-w-xl text-body text-text-secondary">{featured.description}</p>
          <p className="text-body-lg font-medium text-text-accent">
            {formatEth(featured.priceEth)}
          </p>
          <Button asChild variant="default" size="default" className="mt-2">
            <Link to="/nft/$id" params={{ id: featured.id }}>
              Ver detalhes
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
