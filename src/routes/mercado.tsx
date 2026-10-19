import { createRoute, Link } from '@tanstack/react-router'
import { Route as rootRoute } from '@/routes/__root'
import { nftSearchSchema } from '@/features/discovery/useNftSearch'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Discovery } from '@/features/discovery/Discovery'
import { SearchBox } from '@/features/discovery/SearchBox'
import { useNftEvents } from '@/features/realtime/useNftEvents'

/**
 * Rota `/mercado`: o catálogo completo como página própria (sem o Hero da
 * Início), para que o header/breadcrumb tenham um destino real ao navegar
 * por "Mercado" — em vez de reusar "/" com um nome diferente. Reaproveita
 * `Discovery` (mesmo `validateSearch`/`useNftSearch` da Início — ver
 * comentário em `useNftSearch`).
 */
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mercado',
  validateSearch: nftSearchSchema,
  component: MercadoPage,
})

function MercadoPage() {
  useNftEvents()

  return (
    <div className="flex min-h-screen flex-col bg-ink font-mono text-text-primary">
      <Header search={<SearchBox />} />
      <main className="flex-1">
        <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-6 pt-8 text-body text-text-secondary">
          <Link to="/" className="hover:text-text-accent">
            Início
          </Link>
          {' / '}
          <span className="text-text-primary">Mercado</span>
        </nav>
        <Discovery />
      </main>
      <Footer />
    </div>
  )
}
