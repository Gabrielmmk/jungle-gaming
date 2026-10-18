import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { registerUnauthorizedHandler } from '@/shared/http/axios'
import { tokenStore } from '@/features/auth/tokenStore'
import { clearPrivateSession } from '@/features/auth/useAuthMutations'

export interface RouterContext {
  queryClient: QueryClient
}

/**
 * Rota raiz: `Outlet` + um observador de sessão que trata expiração (401).
 * `notFoundComponent` cobre qualquer caminho sem rota (404 global).
 */
export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function RootComponent() {
  useExpirationRedirect()
  return <Outlet />
}

/**
 * Em 401 fora dos endpoints de auth (sessão expirada durante navegação),
 * limpa a sessão e redireciona ao login preservando o destino atual.
 */
function useExpirationRedirect() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const href = useRouterState({ select: (s) => s.location.href })

  useEffect(() => {
    return registerUnauthorizedHandler(() => {
      tokenStore.clear()
      clearPrivateSession(queryClient)
      navigate({ to: '/login', search: { redirect: href } })
    })
  }, [navigate, queryClient, href])
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
