import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry: () => void
}

/**
 * Estado de erro — usado quando a busca de NFTs falha (ex.: cenário
 * `transient`, que simula um 503). `onRetry` é obrigatório: este
 * componente sempre oferece uma forma de tentar novamente.
 */
export function ErrorState({
  title = 'Não foi possível carregar os NFTs',
  description = 'Ocorreu um erro ao buscar os dados. Tente novamente em instantes.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border-soft bg-surface-card px-6 py-16 text-center"
    >
      <AlertTriangle aria-hidden="true" className="size-10 text-primary" />
      <p className="text-body-lg font-medium text-text-primary">{title}</p>
      <p className="text-body text-text-secondary">{description}</p>
      <Button variant="default" size="sm" className="mt-2" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}
