import { useState, type ReactNode, type ChangeEvent, type FormEvent } from 'react'
import { ZodError } from 'zod'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/form/Field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { profileUpdateSchema, passwordChangeSchema, AVATAR_MAX_BYTES } from '@/contracts/profile'
import type { User } from '@/contracts/auth'
import { useProfile } from '@/features/account/useProfile'
import { parseApiError } from '@/features/auth/apiError'

const zodFieldErrors = (error: ZodError): Record<string, string> => {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (key && !fields[key]) fields[key] = issue.message
  }
  return fields
}

const ENS_SUFFIX = '.eth'

/**
 * Perfil do colecionador + "Alterar senha" num único formulário (fiel ao
 * Figma: um só botão "Salvar"). A troca de senha só é enviada se algum dos
 * três campos foi preenchido — do contrário o `passwordChangeSchema` sempre
 * reprovaria por obrigatoriedade.
 */
export function ProfileForm({ user }: { user: User }): ReactNode {
  const { update, changePassword, setAvatar } = useProfile()
  const [form, setForm] = useState({
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    walletNickname: user.walletNickname ?? '',
  })
  const [ensLocal, setEnsLocal] = useState(() => (user.ensName ?? '').replace(/\.eth$/, ''))
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))
  const setPwd = (k: keyof typeof password) => (v: string) => setPassword((p) => ({ ...p, [k]: v }))

  const wantsPasswordChange = Boolean(
    password.currentPassword || password.newPassword || password.confirmPassword,
  )

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})
    setGeneral(null)
    setSaved(false)

    let profileInput
    try {
      profileInput = profileUpdateSchema.parse({
        displayName: form.displayName,
        username: form.username,
        email: form.email,
        ensName: ensLocal ? `${ensLocal}${ENS_SUFFIX}` : undefined,
        walletNickname: form.walletNickname || undefined,
      })
    } catch (err) {
      if (err instanceof ZodError) {
        setErrors(zodFieldErrors(err))
        return
      }
      throw err
    }

    let passwordInput: typeof password | null = null
    if (wantsPasswordChange) {
      try {
        passwordInput = passwordChangeSchema.parse(password)
      } catch (err) {
        if (err instanceof ZodError) {
          setErrors(zodFieldErrors(err))
          return
        }
        throw err
      }
    }

    try {
      await update.mutateAsync(profileInput)
      if (passwordInput) {
        await changePassword.mutateAsync(passwordInput)
        setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
      setSaved(true)
    } catch (err) {
      const parsed = parseApiError(err, 'Falha ao salvar o perfil')
      // o db retorna validation (senha atual incorreta) sem fields → mostrar no campo atual
      if (parsed.message.toLowerCase().includes('atual')) {
        setErrors({ currentPassword: parsed.message })
      } else if (Object.keys(parsed.fields).length > 0) {
        setErrors(parsed.fields)
      } else {
        setGeneral(parsed.message)
      }
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

  const pending = update.isPending || changePassword.isPending

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-heading text-text-primary">Perfil do colecionador</h1>

      <form onSubmit={submit} className="flex flex-col gap-10" noValidate>
        <div className="grid gap-x-10 gap-y-5 md:grid-cols-2">
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
          <div className="flex flex-col gap-1.5">
            <label className="text-caption font-medium text-text-secondary">
              Nome ENS<span className="ml-0.5 text-text-accent">*</span>
            </label>
            <div className="flex gap-2">
              <Select value={ENS_SUFFIX}>
                <SelectTrigger className="w-24 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ENS_SUFFIX}>{ENS_SUFFIX}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={ensLocal}
                onChange={(e) => setEnsLocal(e.target.value)}
                aria-invalid={!!errors.ensName}
                placeholder="nome"
              />
            </div>
            {errors.ensName && (
              <p role="alert" className="text-caption text-red-400">
                {errors.ensName}
              </p>
            )}
          </div>

          <Field
            label="Apelido da carteira"
            name="walletNickname"
            value={form.walletNickname}
            onChange={set('walletNickname')}
            error={errors.walletNickname}
            required
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-caption font-medium text-text-secondary">Avatar</span>
            <div className="flex items-center gap-4">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar atual"
                  className="size-12 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-12 items-center justify-center rounded-full bg-surface-dark text-text-secondary">
                  —
                </span>
              )}
              <label className="cursor-pointer rounded-md bg-primary px-4 py-2 text-caption font-semibold text-ink">
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
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="text-body-lg text-text-primary">Alterar senha</h2>
          <div className="flex max-w-md flex-col gap-5">
            <Field
              label="Senha atual"
              name="currentPassword"
              type="password"
              value={password.currentPassword}
              onChange={setPwd('currentPassword')}
              error={errors.currentPassword}
              autoComplete="current-password"
            />
            <Field
              label="Nova senha"
              name="newPassword"
              type="password"
              value={password.newPassword}
              onChange={setPwd('newPassword')}
              error={errors.newPassword}
              autoComplete="new-password"
            />
            <Field
              label="Confirmar nova senha"
              name="confirmPassword"
              type="password"
              value={password.confirmPassword}
              onChange={setPwd('confirmPassword')}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
          </div>
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

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Salvando…' : 'Salvar'}
        </Button>
      </form>
    </div>
  )
}
