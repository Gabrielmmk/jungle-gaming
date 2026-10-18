import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/http/axios'
import { useSession } from '@/features/auth/useSession'

interface UseFavoritesResult {
  favorites: string[]
  isAuthenticated: boolean
  isLoading: boolean
  isFavorite: (id: string) => boolean
  toggleFavorite: (id: string) => void
  showLoginPrompt: boolean
  dismissLoginPrompt: () => void
}

/**
 * Favoritos do usuário autenticado. Sem sessão, `toggleFavorite` não chama
 * a API — apenas liga `showLoginPrompt` (a página decide o dialog/redirect).
 *
 * Com sessão, o toggle é **otimista**: atualiza o cache de `['favorites']`
 * imediatamente, faz **rollback** ao estado anterior em caso de erro e
 * invalida ao concluir — satisfazendo o requisito de atualização otimista
 * com rollback (§4 do enunciado).
 */
export function useFavorites(): UseFavoritesResult {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useSession()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const query = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.get('/favorites').then((r) => r.data as string[]),
    enabled: isAuthenticated,
    retry: false,
  })

  const favorites = isAuthenticated ? (query.data ?? []) : []
  const isFavorite = (id: string) => favorites.includes(id)

  const toggle = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      if (next) await api.post(`/favorites/${id}`)
      else await api.delete(`/favorites/${id}`)
    },
    onMutate: async ({ id, next }) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] })
      const previous = queryClient.getQueryData<string[]>(['favorites']) ?? []
      const optimistic = next ? [...previous, id] : previous.filter((f) => f !== id)
      queryClient.setQueryData(['favorites'], optimistic)
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(['favorites'], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const toggleFavorite = (id: string) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }
    toggle.mutate({ id, next: !isFavorite(id) })
  }

  return {
    favorites,
    isAuthenticated,
    isLoading: query.isLoading,
    isFavorite,
    toggleFavorite,
    showLoginPrompt,
    dismissLoginPrompt: () => setShowLoginPrompt(false),
  }
}
