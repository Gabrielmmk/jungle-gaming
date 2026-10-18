import { useState, type ReactNode } from 'react'
import { ZodError } from 'zod'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/form/Field'
import { passwordChangeSchema } from '@/contracts/profile'
import { useProfile } from '@/features/account/useProfile'
import { parseApiError } from '@/features/auth/apiError'

export function PasswordForm(): ReactNode {
  const { changePassword } = useProfile()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
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
      const input = passwordChangeSchema.parse(form)
      await changePassword.mutateAsync(input)
      setSaved(true)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
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
      const parsed = parseApiError(err, 'Falha ao alterar a senha')
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

  return (
    <form onSubmit={submit} className="flex max-w-md flex-col gap-5" noValidate>
      <h2 className="text-body-lg text-text-primary">Alterar senha</h2>
      <Field
        label="Senha atual"
        name="currentPassword"
        type="password"
        value={form.currentPassword}
        onChange={set('currentPassword')}
        error={errors.currentPassword}
        required
        autoComplete="current-password"
      />
      <Field
        label="Nova senha"
        name="newPassword"
        type="password"
        value={form.newPassword}
        onChange={set('newPassword')}
        error={errors.newPassword}
        required
        autoComplete="new-password"
      />
      <Field
        label="Confirmar nova senha"
        name="confirmPassword"
        type="password"
        value={form.confirmPassword}
        onChange={set('confirmPassword')}
        error={errors.confirmPassword}
        required
        autoComplete="new-password"
      />
      {general && (
        <p role="alert" className="text-caption text-red-400">
          {general}
        </p>
      )}
      {saved && (
        <p role="status" className="text-caption text-text-accent">
          Senha alterada.
        </p>
      )}
      <Button type="submit" disabled={changePassword.isPending} className="self-start">
        {changePassword.isPending ? 'Salvando…' : 'Alterar senha'}
      </Button>
    </form>
  )
}
