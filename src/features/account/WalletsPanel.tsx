import { useState, type ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import { useWallets } from '@/features/account/useWallets'
import { WalletForm } from '@/features/account/WalletForm'
import type { Wallet } from '@/contracts/wallet'

export function WalletsPanel(): ReactNode {
  const { data: wallets, isLoading, isError, add, update } = useWallets()
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-heading text-text-primary">Carteiras</h1>

      {isLoading && <p className="text-body text-text-secondary">Carregando carteiras…</p>}
      {isError && (
        <p role="alert" className="text-body text-red-400">
          Não foi possível carregar as carteiras.
        </p>
      )}

      {wallets && wallets.length > 0 && (
        <ul className="flex flex-col gap-3">
          {wallets.map((wallet: Wallet) =>
            editingId === wallet.id ? (
              <li key={wallet.id}>
                <WalletForm
                  initial={wallet}
                  pending={update.isPending}
                  onSubmit={async (input) => {
                    await update.mutateAsync({ id: wallet.id, input })
                    setEditingId(null)
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={wallet.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-body text-text-primary">{wallet.label}</p>
                  <p className="truncate text-caption text-text-secondary">
                    {wallet.address} · {wallet.network}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingId(wallet.id)}
                  className="flex items-center gap-1 text-caption text-text-accent hover:underline"
                  aria-label={`Editar carteira ${wallet.label}`}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
                </button>
              </li>
            ),
          )}
        </ul>
      )}

      {wallets && wallets.length === 0 && (
        <p className="text-body text-text-secondary">Nenhuma carteira cadastrada ainda.</p>
      )}

      <div className="max-w-md">
        <h2 className="mb-3 text-body-lg text-text-primary">Adicionar carteira</h2>
        <WalletForm pending={add.isPending} onSubmit={(input) => add.mutateAsync(input)} />
      </div>
    </div>
  )
}
