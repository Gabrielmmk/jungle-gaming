import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from '@/routes/__root'
import { useNfts } from '@/features/nfts/useNfts'
import { useNftEvents } from '@/features/nfts/useNftEvents'
import type { Nft } from '@/contracts/nft'

/**
 * Roteamento code-based: a rota índice é criada a partir da rota raiz
 * (sem geração de arquivos/plugin). Ver src/app/router.tsx, que monta a
 * árvore com `rootRoute.addChildren([...])`.
 */
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
})

function NftCard({ nft }: { nft: Nft }) {
  return (
    <li className="rounded-md border border-border-soft bg-surface-card p-4 font-mono text-text-primary">
      <p className="text-body-lg font-semibold">{nft.name}</p>
      <p className="text-caption text-text-secondary">{nft.collection}</p>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-body text-primary">{nft.priceEth} ETH</span>
        <span className="text-caption text-text-secondary">
          {nft.available > 0 ? `${nft.available} disponíveis` : 'Esgotado'}
        </span>
      </div>
    </li>
  )
}

function IndexPage() {
  const { data, isLoading, isError, error } = useNfts({ page: 1, pageSize: 12 })
  useNftEvents()

  return (
    <main className="min-h-screen bg-ink px-6 py-10 font-mono text-text-primary">
      <h1 className="text-heading text-text-primary">GreenMint — Catálogo (prova Camada 0)</h1>

      {isLoading && (
        <p data-testid="nfts-loading" className="mt-6 text-body text-text-secondary">
          Carregando NFTs...
        </p>
      )}

      {isError && (
        <p data-testid="nfts-error" className="mt-6 text-body text-secondary">
          Falha ao carregar NFTs: {error?.message ?? 'erro desconhecido'}
        </p>
      )}

      {!isLoading && !isError && data && data.items.length === 0 && (
        <p data-testid="nfts-empty" className="mt-6 text-body text-text-secondary">
          Nenhum NFT encontrado.
        </p>
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <ul
          data-testid="nfts-grid"
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {data.items.map((nft) => (
            <NftCard key={nft.id} nft={nft} />
          ))}
        </ul>
      )}
    </main>
  )
}
