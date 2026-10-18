import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from '@/routes/__root'

/**
 * Rota de detalhe do NFT (`/nft/:id`). Placeholder mínimo nesta chunk —
 * só prova que o param `id` chega tipado via `Route.useParams()`. A UI
 * real (imagens, descrição, compra, etc.) chega em uma camada futura.
 */
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$id',
  component: NftDetailPage,
})

function NftDetailPage() {
  const { id } = Route.useParams()

  return (
    <main className="min-h-screen bg-ink px-6 py-10 font-mono text-text-primary">
      <h1 className="text-heading text-text-primary">NFT #{id}</h1>
      <p className="mt-2 text-body text-text-secondary">Detalhe (em construção)</p>
    </main>
  )
}
