import { createRoute, Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { Route as rootRoute } from '@/routes/__root'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/feedback/Skeleton'
import { useCart } from '@/features/cart/useCart'
import { useNftEvents } from '@/features/realtime/useNftEvents'
import { CartItemRow } from '@/features/cart/CartItemRow'
import { CartSummary } from '@/features/cart/CartSummary'

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
  const cart = useCart()

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
                      disabled={cart.update.isPending || cart.remove.isPending}
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
