import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EditionQuantityProps {
  available: number
  quantity: number
  onQuantityChange: (quantity: number) => void
}

/**
 * Stepper de quantidade (status "Edição aberta/esgotada" vive em
 * `EditionBadge`, renderizado separadamente acima deste componente).
 * `available` define o teto da quantidade (não dá para pedir mais do que
 * existe em estoque); quando `available === 0` o stepper fica desabilitado.
 */
export function EditionQuantity({ available, quantity, onQuantityChange }: EditionQuantityProps) {
  const soldOut = available === 0

  const decrement = () => onQuantityChange(Math.max(1, quantity - 1))
  const increment = () => onQuantityChange(Math.min(available, quantity + 1))

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="default"
        size="icon"
        className="rounded-full"
        aria-label="Diminuir quantidade"
        disabled={soldOut || quantity <= 1}
        onClick={decrement}
      >
        <Minus aria-hidden="true" className="size-4" />
      </Button>
      <span
        role="status"
        aria-label="Quantidade"
        className="min-w-6 text-center text-body-lg text-text-primary"
      >
        {soldOut ? 0 : quantity}
      </span>
      <Button
        type="button"
        variant="default"
        size="icon"
        className="rounded-full"
        aria-label="Aumentar quantidade"
        disabled={soldOut || quantity >= available}
        onClick={increment}
      >
        <Plus aria-hidden="true" className="size-4" />
      </Button>
    </div>
  )
}
