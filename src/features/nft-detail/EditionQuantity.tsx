import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EditionQuantityProps {
  editionMinted: number
  editionTotal: number
  available: number
  quantity: number
  onQuantityChange: (quantity: number) => void
}

/**
 * Rótulo de edição ("minted/total · Aberta") + stepper de quantidade.
 * `available` define o teto da quantidade (não dá para pedir mais do que
 * existe em estoque); quando `available === 0` o stepper e a ação de
 * compra ficam desabilitados e um rótulo textual ("Edição esgotada")
 * comunica o motivo — não depende só de cor/opacidade para passar a
 * informação.
 */
export function EditionQuantity({
  editionMinted,
  editionTotal,
  available,
  quantity,
  onQuantityChange,
}: EditionQuantityProps) {
  const soldOut = available === 0

  const decrement = () => onQuantityChange(Math.max(1, quantity - 1))
  const increment = () => onQuantityChange(Math.min(available, quantity + 1))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-body text-text-secondary">
        <span>
          Edição{' '}
          <span className="text-text-primary">
            {editionMinted}/{editionTotal}
          </span>{' '}
          · {soldOut ? 'Esgotada' : 'Aberta'}
        </span>
        {soldOut && (
          <span className="text-caption font-medium uppercase tracking-wide text-primary">
            Edição esgotada
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span id="quantity-label" className="text-body text-text-secondary">
          Quantidade
        </span>
        <div className="flex items-center rounded-md border border-border-soft">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Diminuir quantidade"
            disabled={soldOut || quantity <= 1}
            onClick={decrement}
          >
            <Minus aria-hidden="true" className="size-4" />
          </Button>
          <span
            role="status"
            aria-labelledby="quantity-label"
            className="min-w-10 text-center text-body-lg text-text-primary"
          >
            {soldOut ? 0 : quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Aumentar quantidade"
            disabled={soldOut || quantity >= available}
            onClick={increment}
          >
            <Plus aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
