import { Link } from '@tanstack/react-router'
import { PackageCheck, PackageX } from 'lucide-react'
import type { Nft } from '@/contracts/nft'
import { formatEth } from '@/shared/eth/money'

/**
 * Card de NFT usado na grade do catálogo. A imagem tem `aspect-ratio`
 * fixo para evitar CLS (mesmo footprint do skeleton — ver
 * `NftCardSkeleton`). A disponibilidade não depende só de cor: inclui
 * ícone + texto, para não falhar em contraste/daltonismo.
 */
export function NftCard({ item }: { item: Nft }) {
  const isAvailable = item.available > 0

  return (
    <Link
      to="/nft/$id"
      params={{ id: item.id }}
      data-testid="nft-card"
      className="group block overflow-hidden rounded-lg border border-border-soft bg-surface-card transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
    >
      <div className="aspect-square w-full overflow-hidden bg-surface-dark">
        <img
          src={item.image}
          alt={`${item.name} — ${item.collection}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-1 p-4">
        <p className="truncate text-caption uppercase tracking-wide text-text-secondary">
          {item.collection}
        </p>
        <h3 className="truncate text-body-lg font-medium text-text-primary">{item.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-body-lg font-medium text-text-accent">
            {formatEth(item.priceEth)}
          </span>
          <span
            className={
              'flex items-center gap-1 text-caption ' +
              (isAvailable ? 'text-secondary' : 'text-text-secondary')
            }
          >
            {isAvailable ? (
              <>
                <PackageCheck aria-hidden="true" className="size-3.5" />
                Disponível
              </>
            ) : (
              <>
                <PackageX aria-hidden="true" className="size-3.5" />
                Esgotado
              </>
            )}
          </span>
        </div>
      </div>
    </Link>
  )
}
