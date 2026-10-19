import { useId, useState, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FieldProps {
  label: string
  name: string
  type?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  autoComplete?: string
  placeholder?: string
  disabled?: boolean
  /** Esconde o label visualmente (mantém acessível via sr-only) para telas onde o placeholder já comunica o campo. */
  hideLabel?: boolean
  /** Para campos senha: permite ocultar o botão de revelar (ex.: "confirmar senha"). */
  allowReveal?: boolean
}

/** Campo de formulário acessível: label associado + erro com aria-describedby/role=alert. */
export function Field({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required,
  autoComplete,
  placeholder,
  disabled,
  hideLabel,
  allowReveal = true,
}: FieldProps): ReactNode {
  const id = useId()
  const errorId = `${id}-error`
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const showToggle = isPassword && allowReveal
  const inputType = isPassword && visible ? 'text' : type

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={cn('text-caption font-medium text-text-secondary', hideLabel && 'sr-only')}
      >
        {label}
        {required && <span className="ml-0.5 text-text-accent">*</span>}
      </label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          className={showToggle ? 'pr-10' : undefined}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-accent hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-caption text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
