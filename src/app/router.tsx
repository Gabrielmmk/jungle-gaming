import { createRouter } from '@tanstack/react-router'
import { queryClient } from '@/shared/query/queryClient'
import { Route as rootRoute } from '@/routes/__root'
import { Route as indexRoute } from '@/routes/index'
import { Route as nftDetailRoute } from '@/routes/nft.$id'
import { Route as loginRoute } from '@/routes/login'
import { Route as registerRoute } from '@/routes/register'
import { Route as profileRoute } from '@/routes/profile'
import { Route as walletsRoute } from '@/routes/wallets'

/**
 * Roteamento code-based (sem geração por arquivo). A árvore inclui as
 * telas públicas (início, detalhe) e as de conta (login/cadastro/perfil/
 * carteiras). O `queryClient` é injetado no contexto do router para que os
 * guards `beforeLoad` possam carregar a sessão via `ensureQueryData`.
 */
const routeTree = rootRoute.addChildren([
  indexRoute,
  nftDetailRoute,
  loginRoute,
  registerRoute,
  profileRoute,
  walletsRoute,
])

export const router = createRouter({ routeTree, context: { queryClient } })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
