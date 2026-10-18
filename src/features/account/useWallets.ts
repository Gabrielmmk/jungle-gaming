import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/shared/http/axios'
import { walletSchema, type Wallet, type WalletInput } from '@/contracts/wallet'

const walletsSchema = z.array(walletSchema)

const fetchWallets = async (): Promise<Wallet[]> => {
  const { data } = await api.get('/wallets')
  return walletsSchema.parse(data)
}

export function useWallets() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['wallets'], queryFn: fetchWallets })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['wallets'] })

  const add = useMutation({
    mutationFn: async (input: WalletInput) => {
      const { data } = await api.post('/wallets', input)
      return walletSchema.parse(data)
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: WalletInput }) => {
      const { data } = await api.patch(`/wallets/${id}`, input)
      return walletSchema.parse(data)
    },
    onSuccess: invalidate,
  })

  return { ...query, add, update }
}
