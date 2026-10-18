import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/http/axios'
import { userSchema, type User } from '@/contracts/auth'
import type { ProfileUpdateInput } from '@/contracts/profile'

const fetchProfile = async (): Promise<User> => {
  const { data } = await api.get('/profile')
  return userSchema.parse(data)
}

export function useProfile() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['profile'], queryFn: fetchProfile })

  const onUser = (user: User) => {
    queryClient.setQueryData(['profile'], user)
    queryClient.setQueryData(['session'], user)
  }

  const update = useMutation({
    mutationFn: async (input: ProfileUpdateInput) => {
      const { data } = await api.patch('/profile', input)
      return userSchema.parse(data)
    },
    onSuccess: onUser,
  })

  const changePassword = useMutation({
    mutationFn: async (input: {
      currentPassword: string
      newPassword: string
      confirmPassword: string
    }) => {
      await api.post('/profile/password', input)
    },
  })

  const setAvatar = useMutation({
    mutationFn: async (avatarUrl: string | null) => {
      const { data } = await api.put('/profile/avatar', { avatarUrl })
      return userSchema.parse(data)
    },
    onSuccess: onUser,
  })

  return { ...query, update, changePassword, setAvatar }
}
