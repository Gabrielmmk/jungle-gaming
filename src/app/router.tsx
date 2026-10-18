import { createRouter } from '@tanstack/react-router'
import { Route as rootRoute } from '@/routes/__root'
import { Route as indexRoute } from '@/routes/index'

/**
 * Roteamento code-based (sem geração de rotas por arquivo) — ver nota no
 * plano da Camada 0: evita depender da tooling de geração do TanStack
 * Router nesta fase. `routes/__root.tsx` e `routes/index.tsx` já exportam
 * `Route` via `createRootRoute`/`createFileRoute`; aqui apenas montamos a
 * árvore e criamos o router.
 */
const routeTree = rootRoute.addChildren([indexRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
