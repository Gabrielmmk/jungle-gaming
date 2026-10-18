import { QueryClient } from '@tanstack/react-query'

/**
 * Instância única do React Query usada por toda a app.
 *
 * Escolhas de default (documentadas aqui porque serão referenciadas em
 * ARCHITECTURE.md):
 * - `staleTime: 30_000` — o catálogo mockado muda por eventos de socket
 *   (nft.updated), não por polling; 30s evita refetches redundantes entre
 *   navegações próximas enquanto ainda mantém os dados razoavelmente
 *   frescos caso o socket não esteja disponível.
 * - `retry: 1` — uma única retentativa automática. O ambiente mock tem
 *   cenários de falha determinísticos (ver scenarios.ts); retries
 *   agressivos apenas mascarariam esses cenários nos testes/demo.
 * - `refetchOnWindowFocus: false` — evita refetches surpresa durante a
 *   prova de conceito/demo (e nos testes), já que a atualização "ao vivo"
 *   é responsabilidade do canal de socket (useNftEvents), não do foco da
 *   janela.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
