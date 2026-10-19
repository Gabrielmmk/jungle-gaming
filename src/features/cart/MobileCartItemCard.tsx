import { type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatEth } from '@/shared/eth/money'
import type { QuoteItem } from '@/contracts/cart'

interface MobileCartItemCardProps {
  item: QuoteItem
  onUpdateQty: (qty: number) => void
  onRemove: () => void
  disabled?: boolean
}

/**
 * Card de item do carrinho (layout mobile dedicado — ver `CartItemRow` para
 * a versão em tabela do desktop). No teto de disponibilidade, o "+" vira um
 * atalho para remover o item em vez de ficar desabilitado sem ação.
 */
export function MobileCartItemCard({
  item,
  onUpdateQty,
  onRemove,
  disabled,
}: MobileCartItemCardProps): ReactNode {
  const { nft, qty, lineTotalEth } = item
  const atMax = qty >= nft.available

  return (
    <div className="flex gap-3 rounded-lg bg-surface-card p-3" data-testid="cart-row">
      <Link to="/nft/$id" params={{ id: nft.id }} className="shrink-0">
        <img src={nft.image} alt="" className="size-16 rounded-md object-cover" />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          to="/nft/$id"
          params={{ id: nft.id }}
          className="block truncate text-body font-bold text-text-primary hover:text-text-accent"
        >
          {nft.name}
        </Link>

        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-caption text-text-secondary">
            Edição: {nft.editionMinted}/{nft.editionTotal}
          </p>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              disabled={disabled || qty <= 1}
              onClick={() => onUpdateQty(qty - 1)}
              className="flex size-7 items-center justify-center rounded-full bg-primary text-ink disabled:opacity-40"
            >
              <Minus className="size-3.5" aria-hidden />
            </button>
            <span
              className="min-w-[1.5ch] text-center text-body text-text-primary"
              aria-live="polite"
            >
              {qty}
            </span>
            {atMax ? (
              <button
                type="button"
                aria-label={`Remover ${nft.name}`}
                disabled={disabled}
                onClick={onRemove}
                className="flex size-7 items-center justify-center rounded-full bg-primary text-ink disabled:opacity-40"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Aumentar quantidade"
                disabled={disabled}
                onClick={() => onUpdateQty(qty + 1)}
                className="flex size-7 items-center justify-center rounded-full bg-primary text-ink disabled:opacity-40"
              >
                <Plus className="size-3.5" aria-hidden />
              </button>
            )}
          </div>
        </div>

        <p className="mt-2 text-body-lg font-bold text-text-accent">{formatEth(lineTotalEth)}</p>
      </div>
    </div>
  )
}
