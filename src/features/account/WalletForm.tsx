import { useState, type ReactNode } from 'react'
import { ZodError } from 'zod'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/form/Field'
import {
  walletInputSchema,
  WALLET_NETWORKS,
  type Wallet,
  type WalletInput,
} from '@/contracts/wallet'
import { parseApiError } from '@/features/auth/apiError'

interface WalletFormProps {
  initial?: Wallet
  pending?: boolean
  onSubmit: (input: WalletInput) => Promise<unknown>
  onCancel?: () => void
}

export function WalletForm({ initial, pending, onSubmit, onCancel }: WalletFormProps): ReactNode {
  const [form, setForm] = useState<WalletInput>({
    label: initial?.label ?? '',
    address: initial?.address ?? '',
    network: initial?.network ?? 'Ethereum',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState<string | null>(null)
  const set = (k: keyof WalletInput) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setGeneral(null)
    try {
      const input = walletInputSchema.parse(form)
      await onSubmit(input)
      if (!initial) setForm({ label: '', address: '', network: 'Ethereum' })
    } catch (err) {
      if (err instanceof ZodError) {
        const f: Record<string, string> = {}
        err.issues.forEach((i) => {
          const k = i.path.join('.')
          if (k && !f[k]) f[k] = i.message
        })
        setErrors(f)
        return
      }
      const parsed = parseApiError(err, 'Falha ao salvar a carteira')
      if (Object.keys(parsed.fields).length > 0) setErrors(parsed.fields)
      else setGeneral(parsed.message)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-5 rounded-lg border border-border bg-surface-card p-6"
      noValidate
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Apelido da carteira"
          name="label"
          value={form.label}
          onChange={set('label')}
          error={errors.label}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wallet-network" className="text-caption font-medium text-text-secondary">
            Rede<span className="ml-0.5 text-text-accent">*</span>
          </label>
          <select
            id="wallet-network"
            value={form.network}
            onChange={(e) => set('network')(e.target.value)}
            className="rounded-md border border-border-soft bg-ink px-3 py-2 font-mono text-body text-text-primary focus:border-primary focus:outline-none"
          >
            {WALLET_NETWORKS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Field
        label="Endereço da carteira"
        name="address"
        value={form.address}
        onChange={set('address')}
        error={errors.address}
        required
        placeholder="0x…"
      />
      {general && (
        <p role="alert" className="text-caption text-red-400">
          {general}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {initial ? 'Salvar' : 'Adicionar carteira'}
        </Button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-caption text-text-secondary hover:text-text-primary"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
