import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { sessionQueryOptions } from '@/features/auth/useSession'

interface GuardArgs {
  context: { queryClient: QueryClient }
  location: { href: string }
}

/**
 * `beforeLoad` para fluxos privados. Garante o carregamento da sessão
 * (evita decidir antes dela chegar) e redireciona ao login preservando o
 * destino quando não há sessão — funciona em acesso direto e refresh.
 */
export const requireAuth = async ({ context, location }: GuardArgs): Promise<void> => {
  const user = await context.queryClient.ensureQueryData(sessionQueryOptions)
  if (!user) {
    throw redirect({ to: '/login', search: { redirect: location.href } })
  }
}
