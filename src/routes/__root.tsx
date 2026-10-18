import { Outlet } from '@tanstack/react-router'
import { createRootRoute } from '@tanstack/react-router'

/**
 * Rota raiz: apenas o `Outlet` onde as rotas filhas são renderizadas. Sem
 * layout de app ainda (header/nav ficam para uma camada futura) — o
 * objetivo da Camada 0 é provar a stack ponta-a-ponta, não a UI final.
 */
export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return <Outlet />
}
