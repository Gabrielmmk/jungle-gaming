import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from '@/shared/http/axios'

interface UseFavoritesResult {
  favorites: string[]
  isAuthenticated: boolean
  isLoading: boolean
  isFavorite: (id: string) => boolean
  toggleFavorite: (id: string) => void
  /**
   * `true` enquanto o prompt de login (favoritar sem sessão) deve ser
   * exibido. A página decide a UI (ex.: um dialog), este hook só expõe o
   * estado e `dismissLoginPrompt` para fechá-lo.
   */
  showLoginPrompt: boolean
  dismissLoginPrompt: () => void
}

/**
 * Favoritos desta camada: ainda não existe sessão de usuário (ver
 * `GET /api/favorites` → 401 sempre, nesta fase). Em vez de tratar o 401
 * como um erro fatal, ele é interpretado como "não autenticado" —
 * `isAuthenticated: false` e `favorites: []`.
 *
 * Com `isAuthenticated: false`, `toggleFavorite` NUNCA chama a API de
 * favoritos: apenas liga `showLoginPrompt`, para a página oferecer um
 * caminho de login (dialog) sem fingir que a ação foi aplicada. Essa
 * decisão evita fazer uma chamada que sabemos que vai 401 e evita navegar
 * para `/login` (rota que ainda não existe nesta camada).
 */
export function useFavorites(): UseFavoritesResult {
  const queryClient = useQueryClient()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const query = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.get('/favorites').then((r) => r.data as string[]),
    retry: false,
  })

  const isAuthenticated = !(isAxiosError(query.error) && query.error.response?.status === 401)

  const favorites = isAuthenticated ? (query.data ?? []) : []

  const addMutation = useMutation({
    mutationFn: (id: string) => api.post(`/favorites/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/favorites/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })

  const isFavorite = (id: string) => favorites.includes(id)

  const toggleFavorite = (id: string) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }

    if (isFavorite(id)) {
      removeMutation.mutate(id)
    } else {
      addMutation.mutate(id)
    }
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
