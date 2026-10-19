import { Link } from '@tanstack/react-router'
import { PackageCheck, PackageX } from 'lucide-react'
import type { Nft } from '@/contracts/nft'
import { formatEth } from '@/shared/eth/money'
import { NftCardFavorite } from '@/components/nft/NftCardFavorite'

const SCARCE_THRESHOLD = 2

/**
 * Card de NFT usado na grade do catálogo. A imagem tem `aspect-ratio`
 * fixo para evitar CLS (mesmo footprint do skeleton — ver
 * `NftCardSkeleton`). A disponibilidade não depende só de cor: inclui
 * ícone + texto, para não falhar em contraste/daltonismo.
 *
 * `mobileCard`: variante compacta do cartão mobile da Início (Figma) —
 * favoritar por cima da imagem + badge "Raro" (poucas unidades
 * disponíveis) + meta (coleção/disponibilidade) escondida em telas
 * pequenas. Opt-in para não alterar o cartão já fiel usado em Mercado.
 */
export function NftCard({ item, mobileCard = false }: { item: Nft; mobileCard?: boolean }) {
  const isAvailable = item.available > 0
  const isScarce = isAvailable && item.available <= SCARCE_THRESHOLD

  return (
    <Link
      to="/nft/$id"
      params={{ id: item.id }}
      data-testid="nft-card"
      className="group relative block overflow-hidden rounded-lg border border-border-soft bg-surface-card transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface-dark">
        <img
          src={item.image}
          alt={`${item.name} — ${item.collection}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
        />
        {mobileCard && isScarce && (
          <span className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-tiny font-bold uppercase tracking-wide text-ink">
            Raro
          </span>
        )}
        {mobileCard && <NftCardFavorite id={item.id} />}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <p
          className={
            'truncate text-caption uppercase tracking-wide text-text-secondary' +
            (mobileCard ? ' hidden sm:block' : '')
          }
        >
          {item.collection}
        </p>
        <h3 className="truncate text-body-lg font-medium text-text-primary">{item.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-body-lg font-medium text-text-accent">
            {formatEth(item.priceEth)}
          </span>
          <span
            className={
              'items-center gap-1 text-caption ' +
              (mobileCard ? 'hidden sm:flex ' : 'flex ') +
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
