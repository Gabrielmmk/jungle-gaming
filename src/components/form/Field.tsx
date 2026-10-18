import { type ReactNode, useId } from 'react'
import { Input } from '@/components/ui/input'

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
}: FieldProps): ReactNode {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-caption font-medium text-text-secondary">
        {label}
        {required && <span className="ml-0.5 text-text-accent">*</span>}
      </label>
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && (
        <p id={errorId} role="alert" className="text-caption text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
