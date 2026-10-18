import { Skeleton } from '@/components/feedback/Skeleton'

/**
 * Esqueleto da tela de detalhe — mesmo "footprint" aproximado do layout
 * real (galeria à esquerda, informações à direita) para minimizar CLS
 * quando os dados chegam.
 */
export function NftDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Skeleton className="mb-6 h-4 w-48" />
      <div className="grid gap-10 md:grid-cols-2">
        <div className="flex gap-3">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="size-16 shrink-0" />
            ))}
          </div>
          <Skeleton className="aspect-square w-full flex-1" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}
