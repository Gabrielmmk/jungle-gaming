import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/http/axios'
import {
  authResponseSchema,
  type LoginInput,
  type RegisterInput,
  type User,
} from '@/contracts/auth'
import { tokenStore } from '@/features/auth/tokenStore'
import { guestStore } from '@/features/cart/guestStore'

/** Chaves de queries privadas, removidas do cache em logout/troca de usuário. */
const PRIVATE_KEYS = ['session', 'favorites', 'profile', 'wallets', 'orders'] as const

export function clearPrivateSession(queryClient: ReturnType<typeof useQueryClient>): void {
  for (const key of PRIVATE_KEYS) {
    if (key === 'session') {
      queryClient.setQueryData(['session'], null)
    } else {
      queryClient.removeQueries({ queryKey: [key] })
    }
  }
}

export function useAuthMutations() {
  const queryClient = useQueryClient()

  const applySession = async (token: string, user: User) => {
    tokenStore.set(token)
    // Limpa dados privados de uma sessão anterior antes de ativar a nova.
    for (const key of PRIVATE_KEYS) {
      if (key !== 'session') queryClient.removeQueries({ queryKey: [key] })
    }
    queryClient.setQueryData(['session'], user)
    // Mescla o carrinho do visitante (guest) no carrinho do usuário e
    // descarta a identidade de visitante — preserva os itens ao autenticar.
    try {
      await api.post('/cart/merge', {})
    } catch {
      /* se não houver carrinho de visitante, segue sem bloquear o login */
    }
    guestStore.clear()
    queryClient.invalidateQueries({ queryKey: ['cart'] })
    queryClient.invalidateQueries({ queryKey: ['quote'] })
  }

  const login = useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await api.post('/auth/login', input)
      return authResponseSchema.parse(data)
    },
    onSuccess: ({ token, user }) => applySession(token, user),
  })

  const register = useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { data } = await api.post('/auth/register', input)
      return authResponseSchema.parse(data)
    },
    onSuccess: ({ token, user }) => applySession(token, user),
  })

  const logout = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout', {})
    },
    onSettled: () => {
      tokenStore.clear()
      clearPrivateSession(queryClient)
    },
  })

  return { login, register, logout }
}
