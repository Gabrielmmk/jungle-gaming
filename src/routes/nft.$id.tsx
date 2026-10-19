import { useEffect, useRef, useState } from 'react'
import { createRoute, Link, useRouter } from '@tanstack/react-router'
import { Route as rootRoute } from '@/routes/__root'
import { Star, Mail, ZoomIn, SearchX, ChevronLeft, Heart, ShoppingCart } from 'lucide-react'
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
import { useFavorites } from '@/features/favorites/useFavorites'
import { AuthDialog } from '@/features/auth/AuthDialog'
import { useCart } from '@/features/cart/useCart'
import { useDocumentTitle } from '@/shared/seo/useDocumentTitle'
import { RelatedCollection } from '@/features/nft-detail/RelatedCollection'
import { useNftEvents } from '@/features/realtime/useNftEvents'
import { formatEth } from '@/shared/eth/money'
import { useIsMobile } from '@/shared/responsive/useIsMobile'

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
  const isMobile = useIsMobile()
  const { id } = Route.useParams()
  const { nft, isLoading, isError, notFound, refetch } = useNft(id)
  useDocumentTitle(nft ? `${nft.name} — ${nft.collection}` : null)
  const { add: addToCart } = useCart()
  const router = useRouter()
  const { isFavorite, toggleFavorite, showLoginPrompt, dismissLoginPrompt } = useFavorites()
  const [quantity, setQuantity] = useState(1)
  const [buyFeedback, setBuyFeedback] = useState(false)
  const [updatedMessage, setUpdatedMessage] = useState<string | null>(null)
  const clearBadgeTimeout = useRef<ReturnType<typeof setTimeout>>()

  // Navegar para outro NFT (mudança de `id`) não deve carregar um badge
  // "atualizado" obsoleto do NFT anterior, nem deixar o `setTimeout`
  // pendente da instância anterior disparar `setUpdatedMessage` na nova
  // instância. O cleanup roda tanto ao trocar `id` quanto ao desmontar.
  useEffect(() => {
    return () => {
      clearTimeout(clearBadgeTimeout.current)
      setUpdatedMessage(null)
    }
  }, [id])

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

  const heroImage = nft.images[0]
  const favorited = isFavorite(nft.id)
  const tokenId = nft.name.match(/#\d+/)?.[0] ?? nft.id

  if (isMobile) {
    return (
      <>
        <div className="relative mx-auto max-w-md px-4 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              aria-label="Voltar"
              onClick={() => router.history.back()}
              className="flex size-10 items-center justify-center rounded-full bg-surface-card/80 text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              aria-pressed={favorited}
              aria-label={favorited ? 'Remover dos favoritos' : 'Favoritar'}
              onClick={() => toggleFavorite(nft.id)}
              className="flex size-10 items-center justify-center rounded-full border border-border-soft bg-surface-card/60 text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Heart
                aria-hidden="true"
                className={favorited ? 'size-5 fill-primary text-primary' : 'size-5'}
              />
            </button>
          </div>

          {heroImage && (
            <div className="overflow-hidden rounded-2xl bg-surface-dark">
              <img
                src={heroImage}
                alt={nft.name}
                className="aspect-[4/3.5] w-full object-cover"
              />
            </div>
          )}

          <div className="relative z-10 -mt-5 rounded-t-2xl bg-surface-card px-5 pt-6 pb-6">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-heading font-bold text-text-primary">{nft.name}</h1>
              <span className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-3 py-1 text-caption font-medium text-text-primary">
                <Star aria-hidden="true" className="size-3.5 fill-primary text-primary" />
                {nft.ratingAvg.toFixed(1)} ({nft.ratingCount})
              </span>
            </div>

            <p className="mt-3 text-body text-text-secondary">{nft.description}</p>

            <p className="mt-5 text-body font-bold text-text-primary">Edição:</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-primary px-3 py-1 text-caption font-semibold text-primary">
                {nft.editionMinted}/{nft.editionTotal}
              </span>
              <span className="rounded-full border border-border-soft px-3 py-1 text-caption font-semibold uppercase tracking-wide text-text-secondary">
                {soldOut ? 'Esgotada' : 'Aberta'}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-1 text-body text-text-secondary">
              <p>ID do token: {tokenId}</p>
              <p>Coleção: {nft.collection}</p>
              <p>
                Atributos: {nft.category}, {nft.network}, {nft.format}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border-soft pt-5">
              <div className="flex items-center gap-3">
                <span className="text-body font-bold text-text-primary">Qtd.</span>
                <EditionQuantity
                  available={nft.available}
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                />
              </div>
              <p className="text-body-lg font-bold text-text-accent">{formatEth(nft.priceEth)}</p>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Button
                type="button"
                variant="default"
                className="h-auto flex-1 rounded-full py-3.5 text-body-lg font-bold"
                disabled={soldOut || addToCart.isPending}
                onClick={() =>
                  addToCart.mutate(
                    { nftId: nft.id, qty: quantity },
                    { onSuccess: () => setBuyFeedback(true) },
                  )
                }
              >
                {addToCart.isPending ? 'Adicionando…' : 'Comprar NFT'}
              </Button>
              <Link
                to="/cart"
                aria-label="Ver carrinho"
                className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border-soft bg-ink text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ShoppingCart aria-hidden="true" className="size-5" />
              </Link>
            </div>

            {buyFeedback && (
              <p role="status" className="mt-4 flex items-center gap-2 text-body text-text-accent">
                Adicionado ao carrinho.{' '}
                <Link to="/cart" className="underline">
                  Ver carrinho
                </Link>
              </p>
            )}
          </div>
        </div>

        <AuthDialog
          open={showLoginPrompt}
          onOpenChange={(open) => {
            if (!open) dismissLoginPrompt()
          }}
          description="Entre ou crie sua conta para salvar NFTs nos favoritos."
        />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-body text-text-secondary">
          <Link to="/" className="hover:text-text-accent">
            Início
          </Link>
          {' / '}
          <Link to="/mercado" className="hover:text-text-accent">
            Mercado
          </Link>
        </nav>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="relative">
            <NftGallery name={nft.name} images={nft.images} />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-ink/70 text-text-primary"
            >
              <ZoomIn className="size-4" />
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="text-heading font-bold text-text-primary">{nft.name}</h1>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft pb-4">
              <div className="flex items-center gap-3">
                <p className="text-heading font-bold text-text-accent">
                  {formatEth(nft.priceEth)}
                </p>
                {updatedMessage && <UpdatedBadge message={updatedMessage} />}
              </div>
              <div className="flex items-center gap-1 text-caption text-text-secondary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    aria-hidden="true"
                    className={
                      i < Math.round(nft.ratingAvg)
                        ? 'size-4 fill-primary text-primary'
                        : 'size-4 text-border-soft'
                    }
                  />
                ))}
                <span>{nft.ratingCount} avaliações de colecionadores</span>
              </div>
            </div>

            <div>
              <p className="text-body font-bold text-text-primary">Sobre este NFT:</p>
              <p className="mt-1 text-body text-text-secondary">{nft.description}</p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-body font-bold text-text-primary">Edição:</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-primary px-3 py-1 text-caption font-medium text-primary">
                  {nft.editionMinted}/{nft.editionTotal}
                </span>
                <span className="text-caption font-semibold uppercase tracking-wide text-primary">
                  {soldOut ? 'Esgotada' : 'Aberta'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <EditionQuantity
                available={nft.available}
                quantity={quantity}
                onQuantityChange={setQuantity}
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="default"
                  className="uppercase tracking-wide"
                  disabled={soldOut || addToCart.isPending}
                  onClick={() =>
                    addToCart.mutate(
                      { nftId: nft.id, qty: quantity },
                      { onSuccess: () => setBuyFeedback(true) },
                    )
                  }
                >
                  {addToCart.isPending ? 'Adicionando…' : 'Comprar'}
                </Button>
                <FavoriteButton id={nft.id} />
              </div>
            </div>

            {buyFeedback && (
              <p role="status" className="flex items-center gap-2 text-body text-text-accent">
                Adicionado ao carrinho.{' '}
                <Link to="/cart" className="underline">
                  Ver carrinho
                </Link>
              </p>
            )}

            <div className="flex flex-col gap-1 text-caption text-text-secondary">
              <span>ID do token: {nft.name.match(/#\d+/)?.[0] ?? nft.id}</span>
              <span>Coleção: {nft.collection}</span>
              <span>Atributos: {nft.category}, {nft.network}, {nft.format}</span>
            </div>

            <div className="flex items-center gap-3 text-caption text-text-secondary">
              <span className="font-bold text-text-primary">Compartilhar este NFT:</span>
              <div className="flex items-center gap-3">
                <span aria-label="LinkedIn" title="LinkedIn" className="text-caption font-semibold text-text-primary">
                  in
                </span>
                <Mail aria-label="E-mail" className="size-4 text-text-primary" />
                <span aria-label="Twitter" title="Twitter" className="text-caption font-semibold text-text-primary">
                  X
                </span>
              </div>
            </div>
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
            <div className="flex flex-col gap-5 text-body text-text-secondary">
              <p>{nft.description}</p>

              <div>
                <p className="font-bold text-text-primary">Rede:</p>
                <p>
                  Cunhado na {nft.network}, com procedência registrada on-chain e metadados
                  armazenados de forma imutável.
                </p>
              </div>

              <div>
                <p className="font-bold text-text-primary">Contrato:</p>
                <p>
                  Direitos autorais do criador: {nft.royaltiesPct} nas vendas secundárias, pagos
                  automaticamente pelos mercados compatíveis.
                </p>
              </div>

              <div>
                <p className="font-bold text-text-primary">Direitos autorais:</p>
                <p>
                  {nft.contractAddress.slice(0, 6)}...{nft.contractAddress.slice(-4)} · Contrato
                  inteligente {nft.network === 'Solana' ? 'SPL' : 'ERC-721'} verificado.
                </p>
              </div>
            </div>
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
