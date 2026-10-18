import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from '@tanstack/react-router'
import { queryClient } from '@/shared/query/queryClient'
import { router } from '@/app/router'

/**
 * Composição raiz de providers da app: React Query (+ devtools em dev) e o
 * TanStack Router. Mantido como um componente único e simples — não há
 * ainda provider de autenticação/tema dinâmico nesta camada.
 */
export function Providers() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
