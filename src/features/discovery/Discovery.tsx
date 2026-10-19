import { CATALOG_ANCHOR_ID } from '@/components/home/Hero'
import { FeaturedNft } from '@/components/home/FeaturedNft'
import { NftGrid } from '@/components/nft/NftGrid'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { FiltersPanel } from '@/features/discovery/FiltersPanel'
import { SortSelect } from '@/features/discovery/SortSelect'
import { Pagination } from '@/features/discovery/Pagination'
import { useNftSearch } from '@/features/discovery/useNftSearch'
import { useNfts } from '@/features/discovery/useNfts'

/**
 * Composição do catálogo: filtros + barra de ferramentas (ordenação +
 * total de resultados) + grade + paginação, todos ligados a
 * `useNftSearch()`/`useNfts(search)`. Estados renderizados, em ordem de
 * prioridade:
 *
 * - `isError` -> `ErrorState` com `retry=refetch` (mesmo havendo dados
 *   antigos em cache, um erro na requisição mais recente é um estado que
 *   o usuário precisa resolver).
 * - `isLoading` (primeira carga, sem dados ainda) -> grade de skeletons.
 * - sucesso com `total === 0` -> `EmptyState` com ação "limpar filtros".
 * - sucesso com itens -> grade real. Enquanto uma nova busca está em
 *   voo em segundo plano (`isFetching && !isLoading`), os dados antigos
 *   continuam visíveis (via `keepPreviousData` em `useNfts`) com uma
 *   barra de progresso fina no topo + `aria-busy`, sem escondê-los.
 */
export function Discovery() {
  const { search, setSearch } = useNftSearch()
  const { items, total, facets, pageSize, isLoading, isError, isFetching, refetch } =
    useNfts(search)

  const isBackgroundUpdating = isFetching && !isLoading

  const clearFilters = () => {
    setSearch({
      q: undefined,
      categories: undefined,
      networks: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sort: undefined,
    })
  }

  return (
    <section
      id={CATALOG_ANCHOR_ID}
      className="relative mx-auto max-w-7xl px-6 py-12"
      aria-busy={isBackgroundUpdating}
    >
      {isBackgroundUpdating && (
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 h-0.5 w-full overflow-hidden bg-surface-dark"
        >
          <div className="h-full w-1/3 motion-safe:animate-pulse bg-primary" />
        </div>
      )}

      <div className="flex flex-col gap-8 md:flex-row">
        <div className="flex flex-col gap-6 md:w-64 md:shrink-0">
          <FiltersPanel facets={facets} />
          <FeaturedNft />
        </div>

        <div className="flex-1">
          <div className="mb-6 flex flex-col gap-4 border-b border-border-soft pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div
              role="tablist"
              aria-label="Filtro rápido do catálogo"
              className="flex items-center gap-5 text-body"
            >
              {(
                [
                  { label: 'Todas as NFTs', sort: undefined },
                  { label: 'Novos lançamentos', sort: 'recent' as const },
                  { label: 'Em alta', sort: 'price_desc' as const },
                ] as const
              ).map((tab) => {
                const active = (search.sort ?? undefined) === tab.sort
                return (
                  <button
                    key={tab.label}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => setSearch({ sort: tab.sort })}
                    className={`border-b-2 pb-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      active
                        ? 'border-primary text-text-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-caption text-text-secondary">
                Ordenar por:
              </span>
              <SortSelect />
            </div>
          </div>
          <p className="mb-4 text-caption text-text-secondary">
            {isLoading ? 'Carregando...' : `${total} ${total === 1 ? 'resultado' : 'resultados'}`}
          </p>

          {isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : !isLoading && total === 0 ? (
            <EmptyState actionLabel="Limpar filtros" onAction={clearFilters} />
          ) : (
            <NftGrid items={items} isLoading={isLoading} />
          )}

          {!isError && !isLoading && total > 0 && (
            <div className="mt-10">
              <Pagination total={total} pageSize={pageSize} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
