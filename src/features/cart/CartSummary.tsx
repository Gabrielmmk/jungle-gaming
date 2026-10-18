import { useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatEth } from '@/shared/eth/money'
import type { Quote } from '@/contracts/cart'

interface CartSummaryProps {
  quote: Quote | undefined
  onApplyCoupon: (code: string) => void
  onRemoveCoupon: () => void
}

/** "Resumo da carteira": cupom + subtotal/desconto/taxa/total + CTA checkout. */
export function CartSummary({ quote, onApplyCoupon, onRemoveCoupon }: CartSummaryProps): ReactNode {
  const [code, setCode] = useState('')
  const couponStatus = quote?.coupon
  const empty = !quote || quote.items.length === 0

  return (
    <aside className="flex h-fit flex-col gap-4 rounded-lg border border-border bg-surface-card p-5 font-mono">
      <h2 className="text-body-lg text-text-primary">Resumo da carteira</h2>

      <div className="flex flex-col gap-2">
        <label htmlFor="coupon" className="text-caption text-text-secondary">
          Código promocional
        </label>
        <div className="flex gap-2">
          <Input
            id="coupon"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Digite o código promocional"
            aria-describedby="coupon-status"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => code.trim() && onApplyCoupon(code.trim())}
          >
            Aplicar
          </Button>
        </div>
        <p id="coupon-status" role="status" className="min-h-[1rem] text-caption">
          {couponStatus?.applied && (
            <span className="text-text-accent">
              Cupom {couponStatus.code} aplicado (-{couponStatus.percentOff}%).{' '}
              <button type="button" onClick={onRemoveCoupon} className="underline">
                remover
              </button>
            </span>
          )}
          {couponStatus && !couponStatus.applied && (
            <span className="text-red-400">
              Cupom {couponStatus.reason === 'expired' ? 'expirado' : 'inválido'}.
            </span>
          )}
        </p>
      </div>

      <dl className="flex flex-col gap-2 border-t border-border-soft pt-4 text-body">
        <Row label="Subtotal" value={quote ? formatEth(quote.subtotalEth) : '—'} />
        <Row
          label="Desconto"
          value={quote && Number(quote.discountEth) > 0 ? `- ${formatEth(quote.discountEth)}` : '—'}
          accent
        />
        <Row
          label="Taxa de rede"
          value={quote ? formatEth(quote.networkFeeEth) : '—'}
          hint="Taxa estimada"
        />
      </dl>

      <div className="flex items-center justify-between border-t border-border-soft pt-4">
        <span className="text-body-lg text-text-primary">Total</span>
        <span className="text-body-lg text-primary" data-testid="cart-total">
          {quote ? formatEth(quote.totalEth) : '—'}
        </span>
      </div>

      <Button asChild disabled={empty} className="mt-2">
        <Link to="/checkout" disabled={empty}>
          Conectar e finalizar
        </Link>
      </Button>
      <Link to="/" className="text-center text-caption text-text-accent hover:underline">
        Continuar explorando
      </Link>
    </aside>
  )
}

function Row({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: string
  accent?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-text-secondary">
        {label}
        {hint && <span className="ml-2 text-tiny text-text-secondary/60">{hint}</span>}
      </dt>
      <dd className={accent ? 'text-text-accent' : 'text-text-primary'}>{value}</dd>
    </div>
  )
}
