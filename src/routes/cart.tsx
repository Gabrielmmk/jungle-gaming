import { useState } from 'react'
import { createRoute, Link, useRouter } from '@tanstack/react-router'
import { ChevronLeft, ShoppingCart } from 'lucide-react'
import { Route as rootRoute } from '@/routes/__root'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { useCart } from '@/features/cart/useCart'
import { useNftEvents } from '@/features/realtime/useNftEvents'
import { CartItemRow } from '@/features/cart/CartItemRow'
import { CartSummary } from '@/features/cart/CartSummary'
import { MobileCartItemCard } from '@/features/cart/MobileCartItemCard'
import { formatEth } from '@/shared/eth/money'
import { useIsMobile } from '@/shared/responsive/useIsMobile'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
})

function CartPage() {
  // Mantém catálogo/detalhe e o carrinho sincronizados com nft.updated:
  // mudanças de preço/disponibilidade recebidas enquanto o carrinho está
  // aberto reinvalidam a cotação (ver useNftEvents → invalida ['quote']).
  useNftEvents()
  const isMobile = useIsMobile()
  const cart = useCart()
  const router = useRouter()
  const [promoCode, setPromoCode] = useState('')
  const mutating = cart.update.isPending || cart.remove.isPending
  const empty = !cart.quote || cart.quote.items.length === 0

  if (isMobile) {
    // Tela cheia dedicada: topo com voltar, cards de item em vez de
    // tabela, resumo inline (ver mesmo padrão em /nft/$id).
    return (
      <div className="flex min-h-screen flex-col bg-ink font-mono text-text-primary">
        <div className="flex items-center gap-3 px-4 pt-4">
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => router.history.back()}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-card/80 text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <h1 className="flex-1 pr-10 text-center text-body-lg font-bold text-text-primary">
            Carrinho de NFTs
          </h1>
        </div>

        {cart.isError && (
          <div className="px-4 py-6">
            <ErrorState
              title="Não foi possível carregar o carrinho"
              description="Ocorreu um erro ao buscar o carrinho. Tente novamente."
              onRetry={cart.refetch}
            />
          </div>
        )}

        {cart.isLoading && (
          <div className="flex flex-col gap-3 px-4 py-6" aria-hidden>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {!cart.isLoading && !cart.isError && (
          <main className="flex flex-1 flex-col gap-6 px-4 py-6">
            {empty ? (
              <div className="flex flex-col items-center gap-4 rounded-lg bg-surface-card py-16 text-center">
                <ShoppingCart className="h-10 w-10 text-text-secondary" aria-hidden />
                <p className="text-body text-text-secondary">Seu carrinho está vazio.</p>
                <Link to="/" className="text-body text-primary hover:text-text-accent">
                  Explorar NFTs
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {cart.quote!.items.map((item) => (
                    <MobileCartItemCard
                      key={item.nft.id}
                      item={item}
                      disabled={mutating}
                      onUpdateQty={(qty) => cart.update.mutate({ nftId: item.nft.id, qty })}
                      onRemove={() => cart.remove.mutate(item.nft.id)}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="promo-mobile" className="sr-only">
                    Código promocional
                  </label>
                  <Input
                    id="promo-mobile"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Digite o código promocional..."
                    className="rounded-full"
                  />
                  <Button
                    type="button"
                    onClick={() => promoCode.trim() && cart.applyCoupon(promoCode.trim())}
                    className="shrink-0 rounded-full px-5"
                  >
                    Aplicar
                  </Button>
                </div>
                <p role="status" className="-mt-4 min-h-[1rem] text-caption">
                  {cart.quote!.coupon?.applied && (
                    <span className="text-text-accent">
                      Cupom {cart.quote!.coupon.code} aplicado (-{cart.quote!.coupon.percentOff}%).{' '}
                      <button type="button" onClick={cart.removeCoupon} className="underline">
                        remover
                      </button>
                    </span>
                  )}
                  {cart.quote!.coupon && !cart.quote!.coupon.applied && (
                    <span className="text-red-400">
                      Cupom {cart.quote!.coupon.reason === 'expired' ? 'expirado' : 'inválido'}.
                    </span>
                  )}
                </p>

                <dl className="flex flex-col gap-2 text-body">
                  <MobileLine label="Subtotal" value={formatEth(cart.quote!.subtotalEth)} />
                  <MobileLine
                    label="Desconto do lançamento"
                    value={
                      Number(cart.quote!.discountEth) > 0
                        ? `(-) ${formatEth(cart.quote!.discountEth)}`
                        : '(-) 00.00'
                    }
                  />
                  <MobileLine
                    label="Taxa de rede"
                    value={formatEth(cart.quote!.networkFeeEth)}
                    hint="Taxa estimada"
                  />
                </dl>

                <div className="flex items-center justify-between border-t border-border-soft pt-4">
                  <span className="text-body-lg font-bold text-text-primary">Total</span>
                  <span className="text-body-lg font-bold text-primary">
                    {formatEth(cart.quote!.totalEth)}
                  </span>
                </div>

                <Button asChild className="mt-2 h-auto rounded-full py-3.5 text-body-lg font-bold">
                  <Link to="/checkout" disabled={empty}>
                    Conectar e finalizar
                  </Link>
                </Button>
              </>
            )}
          </main>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink font-mono text-text-primary">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
        <nav aria-label="Trilha" className="text-caption text-text-secondary">
          <Link to="/" className="hover:text-text-accent">
            Início
          </Link>{' '}
          / Carrinho
        </nav>

        {cart.isError && (
          <ErrorState
            title="Não foi possível carregar o carrinho"
            description="Ocorreu um erro ao buscar o carrinho. Tente novamente."
            onRetry={cart.refetch}
          />
        )}

        {cart.isLoading && (
          <div className="flex flex-col gap-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {!cart.isLoading && !cart.isError && (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <section aria-label="Itens do carrinho">
              {cart.quote && cart.quote.items.length > 0 ? (
                <>
                  <div className="hidden grid-cols-[2fr_1fr_auto_1fr_auto] gap-4 border-b border-border px-0 pb-2 text-caption uppercase tracking-wide text-text-secondary md:grid">
                    <span>NFTs</span>
                    <span>Preço</span>
                    <span>Edições</span>
                    <span>Total</span>
                    <span className="sr-only">Ações</span>
                  </div>
                  {cart.quote.items.map((item) => (
                    <CartItemRow
                      key={item.nft.id}
                      item={item}
                      disabled={mutating}
                      onUpdateQty={(qty) => cart.update.mutate({ nftId: item.nft.id, qty })}
                      onRemove={() => cart.remove.mutate(item.nft.id)}
                    />
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface-card py-16 text-center">
                  <ShoppingCart className="h-10 w-10 text-text-secondary" aria-hidden />
                  <p className="text-body text-text-secondary">Seu carrinho está vazio.</p>
                  <Link to="/" className="text-body text-primary hover:text-text-accent">
                    Explorar NFTs
                  </Link>
                </div>
              )}
            </section>

            <CartSummary
              quote={cart.quote}
              onApplyCoupon={cart.applyCoupon}
              onRemoveCoupon={cart.removeCoupon}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

function MobileLine({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-text-secondary">
        {label}
        {hint && <span className="ml-2 text-tiny text-text-secondary/60">{hint}</span>}
      </dt>
      <dd className="text-text-primary">{value}</dd>
    </div>
  )
}
