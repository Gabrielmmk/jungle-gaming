import { useState, type ReactNode, type ChangeEvent } from 'react'
import { ZodError } from 'zod'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/form/Field'
import { profileUpdateSchema, AVATAR_MAX_BYTES } from '@/contracts/profile'
import type { User } from '@/contracts/auth'
import { useProfile } from '@/features/account/useProfile'
import { parseApiError } from '@/features/auth/apiError'

export function ProfileForm({ user }: { user: User }): ReactNode {
  const { update, setAvatar } = useProfile()
  const [form, setForm] = useState({
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensName: user.ensName ?? '',
    walletNickname: user.walletNickname ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setGeneral(null)
    setSaved(false)
    try {
      const input = profileUpdateSchema.parse({
        displayName: form.displayName,
        username: form.username,
        email: form.email,
        ensName: form.ensName || undefined,
        walletNickname: form.walletNickname || undefined,
      })
      await update.mutateAsync(input)
      setSaved(true)
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
      const parsed = parseApiError(err, 'Falha ao salvar o perfil')
      setErrors(parsed.fields)
      if (Object.keys(parsed.fields).length === 0) setGeneral(parsed.message)
    }
  }

  const onAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      if (dataUrl.length > AVATAR_MAX_BYTES) {
        setGeneral('Imagem muito grande (máx. 256 KB).')
        return
      }
      setAvatar.mutate(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-heading text-text-primary">Perfil do colecionador</h1>

      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Nome de exibição"
            name="displayName"
            value={form.displayName}
            onChange={set('displayName')}
            error={errors.displayName}
            required
          />
          <Field
            label="Nome de usuário"
            name="username"
            value={form.username}
            onChange={set('username')}
            error={errors.username}
            required
          />
          <Field
            label="E-mail"
            name="email"
            type="email"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            required
          />
          <Field
            label="Nome ENS"
            name="ensName"
            value={form.ensName}
            onChange={set('ensName')}
            error={errors.ensName}
            placeholder="nome.eth"
          />
          <Field
            label="Apelido da carteira"
            name="walletNickname"
            value={form.walletNickname}
            onChange={set('walletNickname')}
            error={errors.walletNickname}
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-caption text-text-secondary">Avatar</span>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar atual"
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-dark text-text-secondary">
              —
            </span>
          )}
          <label className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-caption text-ink">
            Alterar
            <input type="file" accept="image/*" className="sr-only" onChange={onAvatar} />
          </label>
          {user.avatarUrl && (
            <button
              type="button"
              onClick={() => setAvatar.mutate(null)}
              className="text-caption text-text-secondary hover:text-text-primary"
            >
              Remover
            </button>
          )}
        </div>

        {general && (
          <p role="alert" className="text-caption text-red-400">
            {general}
          </p>
        )}
        {saved && (
          <p role="status" className="text-caption text-text-accent">
            Perfil atualizado.
          </p>
        )}

        <Button type="submit" disabled={update.isPending} className="self-start">
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </form>
    </div>
  )
}
