import { createRoute, Link } from '@tanstack/react-router'
import { Route as rootRoute } from '@/routes/__root'
import { requireAuth } from '@/features/auth/guard'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

/**
 * Placeholder do checkout (Camada 4). Já é uma rota PRIVADA (requireAuth):
 * acessar o checkout sem sessão cai no login preservando o destino — o que
 * exercita a proteção de rotas. A tela de pagamento em si chega na Camada 4.
 */
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  beforeLoad: requireAuth,
  component: CheckoutPage,
})

function CheckoutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-ink font-mono text-text-primary">
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <h1 className="text-heading">Pagamento</h1>
        <p className="text-body text-text-secondary">
          A finalização de compra está em breve nesta demonstração.
        </p>
        <Link to="/cart" className="text-body text-primary hover:text-text-accent">
          Voltar ao carrinho
        </Link>
      </main>
      <Footer />
    </div>
  )
}
