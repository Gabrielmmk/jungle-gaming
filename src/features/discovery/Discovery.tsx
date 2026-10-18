import { CATALOG_ANCHOR_ID } from '@/components/home/Hero'
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
          <div className="h-full w-1/3 animate-pulse bg-primary" />
        </div>
      )}

      <div className="flex flex-col gap-8 md:flex-row">
        <FiltersPanel facets={facets} />

        <div className="flex-1">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body text-text-secondary">
              {isLoading ? 'Carregando...' : `${total} ${total === 1 ? 'resultado' : 'resultados'}`}
            </p>
            <SortSelect />
          </div>

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
