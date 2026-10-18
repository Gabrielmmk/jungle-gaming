import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from '@/routes/__root'
import { nftSearchSchema } from '@/features/discovery/useNftSearch'

/**
 * Roteamento code-based: a rota índice é criada a partir da rota raiz
 * (sem geração de arquivos/plugin). Ver src/app/router.tsx, que monta a
 * árvore com `rootRoute.addChildren([...])`.
 *
 * `validateSearch` usa o schema de busca da Descoberta (Task 5) para que
 * os search params da URL (`?q=`, `?categories=`, `?page=`, ...) sejam
 * validados/tipados pelo Router. A UI real do catálogo (grid, filtros,
 * paginação) chega na Chunk 3 — aqui só provamos que a rota compila e lê
 * a busca validada via `Route.useSearch()`.
 */
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: nftSearchSchema,
  component: IndexPage,
})

function IndexPage() {
  const search = Route.useSearch()

  return (
    <main className="min-h-screen bg-ink px-6 py-10 font-mono text-text-primary">
      <h1 className="text-heading text-text-primary">Discovery (em construção)</h1>
      <p className="mt-2 text-body text-text-secondary">
        page={search.page} pageSize={search.pageSize}
      </p>
    </main>
  )
}
