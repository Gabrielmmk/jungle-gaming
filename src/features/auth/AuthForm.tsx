import { useState, type ReactNode } from 'react'
import { ZodError } from 'zod'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/form/Field'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { FacebookIcon } from '@/components/icons/FacebookIcon'
import { loginSchema, registerSchema } from '@/contracts/auth'
import { useAuthMutations } from '@/features/auth/useAuthMutations'
import { parseApiError } from '@/features/auth/apiError'

type Mode = 'login' | 'register'

interface AuthFormProps {
  defaultMode?: Mode
  onSuccess?: () => void
  description?: string
  /** `dialog` (padrão): abas Entrar/Criar conta clicáveis, usado no modal. `page`: título fixo do modo corrente, usado nas rotas de tela cheia (sem alternância local — a troca de modo é feita navegando para a outra rota). */
  variant?: 'dialog' | 'page'
  /** Título customizado para o variant `page` (ex.: "Criar perfil de colecionador"). */
  title?: string
  /** Rótulo customizado do botão de submit (ex.: "Criar perfil"). */
  submitLabel?: string
  /** Conteúdo extra ao final do card (ex.: link "Já tem uma conta? Entre"). */
  footer?: ReactNode
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
const DEFAULT_DESCRIPTION: Record<Mode, string> = {
  login: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  register: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
}

export function AuthForm({
  defaultMode = 'login',
  onSuccess,
  description,
  variant = 'dialog',
  title,
  submitLabel,
  footer,
}: AuthFormProps): ReactNode {
  const [mode, setMode] = useState<Mode>(defaultMode)
  const { login, register } = useAuthMutations()
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  })
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
        if (form.confirmPassword !== form.password) {
          setErrors({ confirmPassword: 'As senhas não coincidem' })
          return
        }
        const input = registerSchema.parse({
          email: form.email,
          password: form.password,
          displayName: form.username,
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
    <div
      className={
        variant === 'page'
          ? 'w-full max-w-md font-mono'
          : 'w-full max-w-md rounded-lg bg-ink p-8 font-mono'
      }
    >
      {variant === 'dialog' ? (
        <h2
          role="tablist"
          aria-label="Autenticação"
          className="flex items-center justify-center gap-3 text-center text-[28px] font-bold leading-none"
        >
          <button
            role="tab"
            aria-selected={mode === 'login'}
            type="button"
            onClick={() => switchMode('login')}
            className={`transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mode === 'login' ? 'text-text-accent' : 'text-text-primary'
            }`}
          >
            Entrar
          </button>
          <span aria-hidden="true" className="font-normal text-border-soft">
            |
          </span>
          <button
            role="tab"
            aria-selected={mode === 'register'}
            type="button"
            onClick={() => switchMode('register')}
            className={`transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mode === 'register' ? 'text-text-accent' : 'text-text-primary'
            }`}
          >
            Criar conta
          </button>
        </h2>
      ) : (
        <h1 className="text-center text-[20px] font-bold leading-tight text-text-primary">
          {title ?? (mode === 'login' ? 'Entrar' : 'Criar conta')}
        </h1>
      )}

      {variant === 'dialog' && (
        <p className="mx-auto mt-4 max-w-xs text-center text-body text-text-primary">
          {description ?? DEFAULT_DESCRIPTION[mode]}
        </p>
      )}

      <form onSubmit={submit} className="mt-7 flex flex-col gap-4" noValidate>
        {mode === 'register' && (
          <Field
            label="Nome de usuário"
            name="username"
            value={form.username}
            onChange={set('username')}
            error={errors.username}
            required
            autoComplete="username"
            placeholder="Nome de usuário"
            hideLabel
          />
        )}
        <Field
          label="E-mail"
          name="email"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          required
          autoComplete="email"
          placeholder={mode === 'login' ? 'contato@email.com' : 'Digite seu e-mail'}
          hideLabel
        />
        <Field
          label="Senha"
          name="password"
          type="password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder="Senha"
          hideLabel
        />
        {mode === 'register' && (
          <Field
            label="Confirmar senha"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
            placeholder="Confirmar senha"
            hideLabel
            allowReveal={false}
          />
        )}

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
            className="self-end text-body text-text-accent hover:underline"
          >
            Esqueceu a senha?
          </button>
        )}

        <Button
          type="submit"
          disabled={pending}
          data-testid="auth-submit"
          className="h-auto rounded-lg py-3.5 text-body-lg font-bold"
        >
          {pending ? 'Enviando…' : (submitLabel ?? (mode === 'login' ? 'Entrar' : 'Criar conta'))}
        </Button>
      </form>

      <div className="mt-7 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px flex-1 bg-border-soft" />
          <p className="text-body text-text-primary">Ou continue com</p>
          <span aria-hidden="true" className="h-px flex-1 bg-border-soft" />
        </div>

        <button
          type="button"
          onClick={() => setNotice('Login com Google indisponível nesta demonstração.')}
          className="flex items-center justify-center gap-3 rounded-lg border border-border-soft bg-ink px-3 py-3 text-body text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <GoogleIcon className="size-5" />
          Continuar com Google
        </button>
        <button
          type="button"
          onClick={() => setNotice('Login com Facebook indisponível nesta demonstração.')}
          className="flex items-center justify-center gap-3 rounded-lg border border-border-soft bg-ink px-3 py-3 text-body text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <FacebookIcon className="size-5" />
          Continuar com Facebook
        </button>
      </div>

      {footer && <div className="mt-7 text-center">{footer}</div>}
    </div>
  )
}
