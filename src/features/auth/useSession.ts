import { useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { api } from '@/shared/http/axios'
import { userSchema, type User } from '@/contracts/auth'

/** Busca a sessão atual; 401 resolve como `null` (deslogado), não erro. */
export const fetchSession = async (): Promise<User | null> => {
  try {
    const { data } = await api.get('/session')
    return userSchema.parse(data)
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 401) return null
    throw error
  }
}

export const sessionQueryOptions = {
  queryKey: ['session'] as const,
  queryFn: fetchSession,
  retry: false,
  staleTime: 5 * 60 * 1000,
}

export interface SessionState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function useSession(): SessionState {
  const { data, isLoading } = useQuery(sessionQueryOptions)
  return { user: data ?? null, isAuthenticated: !!data, isLoading }
}
