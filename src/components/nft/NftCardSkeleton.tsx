import { Skeleton } from '@/components/feedback/Skeleton'

/**
 * Mesmo footprint de `NftCard` (imagem quadrada + bloco de texto de
 * mesma altura aproximada), para que a troca skeleton -> card real não
 * cause layout shift (CLS).
 */
export function NftCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border-soft bg-surface-card">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-3/4" />
        <div className="mt-2 flex items-center justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}
