import { type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatEth } from '@/shared/eth/money'
import type { QuoteItem } from '@/contracts/cart'

interface CartItemRowProps {
  item: QuoteItem
  onUpdateQty: (qty: number) => void
  onRemove: () => void
  disabled?: boolean
}

/** Linha do carrinho: NFT + preço + stepper de edição (limite = disponibilidade) + total. */
export function CartItemRow({
  item,
  onUpdateQty,
  onRemove,
  disabled,
}: CartItemRowProps): ReactNode {
  const { nft, qty, lineTotalEth } = item
  const max = nft.available

  return (
    <div
      className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border-soft py-4 md:grid-cols-[2fr_1fr_auto_1fr_auto]"
      data-testid="cart-row"
    >
      <div className="flex min-w-0 items-center gap-3">
        <img src={nft.image} alt="" className="h-12 w-12 rounded-md object-cover" />
        <div className="min-w-0">
          <Link
            to="/nft/$id"
            params={{ id: nft.id }}
            className="block truncate text-body text-text-primary hover:text-text-accent"
          >
            {nft.name}
          </Link>
          <p className="truncate text-caption text-text-secondary">ID do item: {nft.id}</p>
        </div>
      </div>

      <span className="hidden text-body text-text-primary md:block">{formatEth(nft.priceEth)}</span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          disabled={disabled || qty <= 1}
          onClick={() => onUpdateQty(qty - 1)}
          className="rounded-md border border-border-soft p-1 text-text-primary disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" aria-hidden />
        </button>
        <span className="min-w-[2ch] text-center text-body text-text-primary" aria-live="polite">
          {qty}
        </span>
        <button
          type="button"
          aria-label="Aumentar quantidade"
          disabled={disabled || qty >= max}
          onClick={() => onUpdateQty(qty + 1)}
          className="rounded-md border border-border-soft p-1 text-text-primary disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      <span className="hidden text-body text-primary md:block">{formatEth(lineTotalEth)}</span>

      <button
        type="button"
        aria-label={`Remover ${nft.name}`}
        onClick={onRemove}
        disabled={disabled}
        className="rounded-md p-2 text-text-secondary hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}
