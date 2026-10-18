import { Link, Outlet } from '@tanstack/react-router'
import { createRootRoute } from '@tanstack/react-router'

/**
 * Rota raiz: apenas o `Outlet` onde as rotas filhas são renderizadas. Sem
 * layout de app ainda (header/nav ficam para uma camada futura) — o
 * objetivo da Camada 0 é provar a stack ponta-a-ponta, não a UI final.
 *
 * `notFoundComponent` cobre qualquer caminho sem rota correspondente
 * (404 global), usando os tokens do tema GreenMint.
 */
export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function RootComponent() {
  return <Outlet />
}

function NotFoundComponent() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-6 py-10 font-mono text-text-primary">
      <p className="text-caption uppercase tracking-widest text-text-secondary">Erro 404</p>
      <h1 className="text-heading text-text-primary">Página não encontrada</h1>
      <p className="text-body text-text-secondary">O endereço acessado não existe ou foi movido.</p>
      <Link
        to="/"
        className="mt-4 rounded-md border border-border-soft bg-surface-card px-4 py-2 text-body text-primary hover:text-text-accent"
      >
        Voltar para o início
      </Link>
    </main>
  )
}
