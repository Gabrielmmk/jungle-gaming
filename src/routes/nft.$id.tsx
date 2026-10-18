import { useRef, useState } from 'react'
import { createRoute, Link } from '@tanstack/react-router'
import { Route as rootRoute } from '@/routes/__root'
import { Star, Share2, SearchX } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ErrorState } from '@/components/feedback/ErrorState'
import { NftDetailSkeleton } from '@/components/nft/NftDetailSkeleton'
import { UpdatedBadge } from '@/components/feedback/UpdatedBadge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNft } from '@/features/nft-detail/useNft'
import { NftGallery } from '@/features/nft-detail/NftGallery'
import { EditionQuantity } from '@/features/nft-detail/EditionQuantity'
import { FavoriteButton } from '@/features/nft-detail/FavoriteButton'
import { RelatedCollection } from '@/features/nft-detail/RelatedCollection'
import { useNftEvents } from '@/features/realtime/useNftEvents'
import { formatEth } from '@/shared/eth/money'

const UPDATED_BADGE_TIMEOUT_MS = 4000

/**
 * Rota de detalhe do NFT (`/nft/:id`). Substitui o placeholder da Camada 0
 * pela UI completa: galeria, informações, edição/quantidade, ações
 * (comprar/favoritar), abas de detalhes/avaliações e "mais desta coleção".
 */
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$id',
  component: NftDetailPage,
})

function NftDetailPage() {
  const { id } = Route.useParams()
  const { nft, isLoading, isError, notFound, refetch } = useNft(id)
  const [quantity, setQuantity] = useState(1)
  const [buyFeedback, setBuyFeedback] = useState(false)
  const [updatedMessage, setUpdatedMessage] = useState<string | null>(null)
  const clearBadgeTimeout = useRef<ReturnType<typeof setTimeout>>()

  // Mantida também na tela de detalhe (não só no catálogo) para que o
  // preço/disponibilidade sejam refletidos em tempo real aqui também, com
  // um indicador acessível de que algo mudou (ver UpdatedBadge).
  useNftEvents({
    onApplied: (updated) => {
      if (updated.id !== id) return
      clearTimeout(clearBadgeTimeout.current)
      setUpdatedMessage('Preço e disponibilidade atualizados agora')
      clearBadgeTimeout.current = setTimeout(() => {
        setUpdatedMessage(null)
      }, UPDATED_BADGE_TIMEOUT_MS)
    },
  })

  if (isLoading) {
    return (
      <>
        <Header />
        <main>
          <NftDetailSkeleton />
        </main>
        <Footer />
      </>
    )
  }

  if (notFound) {
    return (
      <>
        <Header />
        <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <SearchX aria-hidden="true" className="size-12 text-text-secondary" />
          <h1 className="text-heading text-text-primary">NFT não encontrado</h1>
          <p className="text-body text-text-secondary">
            O NFT que você está procurando não existe ou foi removido.
          </p>
          <Link
            to="/"
            className="mt-2 rounded-md border border-border-soft bg-surface-card px-4 py-2 text-body text-primary hover:text-text-accent"
          >
            Voltar para o catálogo
          </Link>
        </main>
        <Footer />
      </>
    )
  }

  if (isError || !nft) {
    return (
      <>
        <Header />
        <main className="px-6 py-16">
          <ErrorState title="Não foi possível carregar este NFT" onRetry={() => refetch()} />
        </main>
        <Footer />
      </>
    )
  }

  const soldOut = nft.available === 0

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-body text-text-secondary">
          <Link to="/" className="hover:text-text-accent">
            Início
          </Link>
          {' / '}
          <Link to="/" className="hover:text-text-accent">
            Mercado
          </Link>
          {' / '}
          <span className="text-text-primary">{nft.name}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2">
          <NftGallery name={nft.name} images={nft.images} />

          <div className="flex flex-col gap-4">
            <p className="text-caption uppercase tracking-wide text-text-secondary">
              {nft.collection}
            </p>
            <h1 className="text-heading text-text-primary">{nft.name}</h1>

            <div className="flex items-center gap-2 text-body text-text-secondary">
              <Star aria-hidden="true" className="size-4 fill-primary text-primary" />
              <span className="text-text-primary">{nft.ratingAvg.toFixed(1)}</span>
              <span>({nft.ratingCount} avaliações)</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <p className="text-heading text-text-accent">{formatEth(nft.priceEth)}</p>
              {updatedMessage && <UpdatedBadge message={updatedMessage} />}
            </div>

            <div>
              <h2 className="text-body-lg font-medium text-text-primary">Sobre este NFT</h2>
              <p className="mt-1 text-body text-text-secondary">{nft.description}</p>
            </div>

            <EditionQuantity
              editionMinted={nft.editionMinted}
              editionTotal={nft.editionTotal}
              available={nft.available}
              quantity={quantity}
              onQuantityChange={setQuantity}
            />

            <div className="flex flex-col gap-1 text-caption text-text-secondary">
              <span>ID: {nft.id}</span>
              <span>Coleção: {nft.collection}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="default"
                disabled={soldOut}
                onClick={() => setBuyFeedback(true)}
              >
                Comprar
              </Button>
              <FavoriteButton id={nft.id} />
              <Button type="button" variant="ghost" size="icon" aria-label="Compartilhar">
                <Share2 aria-hidden="true" className="size-4" />
              </Button>
            </div>

            {/*
              Carrinho é escopo da Camada 3 — em vez de simular um
              "adicionado ao carrinho" (sucesso fictício), avisamos
              honestamente que a funcionalidade ainda não existe.
            */}
            {buyFeedback && (
              <p role="status" className="text-body text-text-secondary">
                Carrinho de compras em breve. Essa ação ainda não está disponível.
              </p>
            )}
          </div>
        </div>

        <Tabs defaultValue="details" className="mt-12">
          <TabsList>
            <TabsTrigger value="details">Detalhes do NFT</TabsTrigger>
            <TabsTrigger value="reviews">
              Avaliações de colecionadores ({nft.ratingCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <dl className="grid gap-4 text-body sm:grid-cols-2">
              <div>
                <dt className="text-text-secondary">Formato</dt>
                <dd className="text-text-primary">{nft.format}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Contrato</dt>
                <dd className="break-all text-text-primary">{nft.contractAddress}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Royalties</dt>
                <dd className="text-text-primary">{nft.royaltiesPct}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Rede</dt>
                <dd className="text-text-primary">{nft.network}</dd>
              </div>
            </dl>
          </TabsContent>

          <TabsContent value="reviews">
            {nft.ratingCount === 0 ? (
              <p className="text-body text-text-secondary">
                Este NFT ainda não recebeu avaliações.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                <li className="rounded-md border border-border-soft bg-surface-card p-4">
                  <div className="flex items-center gap-2 text-body text-text-primary">
                    <Star aria-hidden="true" className="size-4 fill-primary text-primary" />
                    <span>{nft.ratingAvg.toFixed(1)} de média geral</span>
                  </div>
                  <p className="mt-2 text-body text-text-secondary">
                    Avaliações individuais de colecionadores chegam em uma camada futura (esta é uma
                    visão agregada, apresentacional).
                  </p>
                </li>
              </ul>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-12">
          <RelatedCollection collection={nft.collection} excludeId={nft.id} />
        </div>
      </main>
      <Footer />
    </>
  )
}
