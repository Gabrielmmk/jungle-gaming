import { useState, type ReactNode } from 'react'
import { ZodError } from 'zod'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/form/Field'
import { loginSchema, registerSchema } from '@/contracts/auth'
import { useAuthMutations } from '@/features/auth/useAuthMutations'
import { parseApiError } from '@/features/auth/apiError'

type Mode = 'login' | 'register'

interface AuthFormProps {
  defaultMode?: Mode
  onSuccess?: () => void
}

const zodFieldErrors = (error: ZodError): Record<string, string> => {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (key && !fields[key]) fields[key] = issue.message
  }
  return fields
}

/**
 * Formulário de autenticação reusado pela rota e pelo modal (híbrido).
 * Abas Entrar / Criar conta; validação zod no cliente + erros da API
 * associados aos campos. Social e "Esqueceu a senha?" são coerentes sem
 * falso sucesso (integrações reais fora de escopo).
 */
export function AuthForm({ defaultMode = 'login', onSuccess }: AuthFormProps): ReactNode {
  const [mode, setMode] = useState<Mode>(defaultMode)
  const { login, register } = useAuthMutations()
  const [form, setForm] = useState({ email: '', password: '', displayName: '', username: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const pending = login.isPending || register.isPending
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const switchMode = (next: Mode) => {
    setMode(next)
    setErrors({})
    setGeneralError(null)
    setNotice(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setGeneralError(null)
    try {
      if (mode === 'login') {
        const input = loginSchema.parse({ email: form.email, password: form.password })
        await login.mutateAsync(input)
      } else {
        const input = registerSchema.parse({
          email: form.email,
          password: form.password,
          displayName: form.displayName,
          username: form.username,
        })
        await register.mutateAsync(input)
      }
      onSuccess?.()
    } catch (err) {
      if (err instanceof ZodError) {
        setErrors(zodFieldErrors(err))
        return
      }
      const parsed = parseApiError(err, mode === 'login' ? 'Falha no login' : 'Falha no cadastro')
      setErrors(parsed.fields)
      if (Object.keys(parsed.fields).length === 0) setGeneralError(parsed.message)
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-surface-card p-6 font-mono">
      <div className="mb-5 flex gap-2" role="tablist" aria-label="Autenticação">
        {(['login', 'register'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            type="button"
            onClick={() => switchMode(m)}
            className={`rounded-md px-3 py-1.5 text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mode === m ? 'bg-primary text-ink' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {m === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field
          label="E-mail"
          name="email"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          required
          autoComplete="email"
        />
        {mode === 'register' && (
          <>
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
              autoComplete="username"
            />
          </>
        )}
        <Field
          label="Senha"
          name="password"
          type="password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {generalError && (
          <p role="alert" className="text-caption text-red-400">
            {generalError}
          </p>
        )}
        {notice && (
          <p role="status" className="text-caption text-text-secondary">
            {notice}
          </p>
        )}

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => setNotice('Recuperação de senha indisponível nesta demonstração.')}
            className="self-start text-caption text-text-accent hover:underline"
          >
            Esqueceu a senha?
          </button>
        )}

        <Button type="submit" disabled={pending} data-testid="auth-submit">
          {pending ? 'Enviando…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </Button>
      </form>

      <div className="mt-5">
        <p className="mb-3 text-center text-caption text-text-secondary">Ou continue com</p>
        <div className="flex gap-3">
          {['Google', 'Facebook'].map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => setNotice(`Login com ${provider} indisponível nesta demonstração.`)}
              className="flex-1 rounded-md border border-border-soft bg-ink px-3 py-2 text-caption text-text-secondary hover:text-text-primary"
            >
              {provider}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
