import { PackageSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

/**
 * Estado "sem resultados" — usado quando a busca/filtro não encontra
 * nenhum NFT. A ação (ex.: "limpar filtros") é opcional e injetada por
 * quem usa; este componente não sabe nada sobre filtros.
 */
export function EmptyState({
  title = 'Nenhum NFT encontrado',
  description = 'Tente ajustar a busca ou os filtros aplicados.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border-soft bg-surface-card px-6 py-16 text-center">
      <PackageSearch aria-hidden="true" className="size-10 text-text-secondary" />
      <p className="text-body-lg font-medium text-text-primary">{title}</p>
      <p className="text-body text-text-secondary">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
