import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Indicador acessível de que um NFT acabou de ser atualizado em tempo real
 * (evento `nft.updated`) — ex.: preço ou disponibilidade mudaram enquanto a
 * tela estava aberta. `role="status"` dá `aria-live="polite"` implícito,
 * então leitores de tela anunciam a mensagem sem roubar o foco. O estado
 * nunca depende só de cor: ícone + texto.
 *
 * Quem monta decide quando mostrar/esconder (ex.: um timer que limpa após
 * alguns segundos) — este componente é só a apresentação.
 */
export function UpdatedBadge({ message, className }: { message: string; className?: string }) {
  return (
    <p
      role="status"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1 text-caption text-secondary',
        className,
      )}
    >
      <RefreshCw aria-hidden="true" className="size-3.5 motion-safe:animate-spin" />
      {message}
    </p>
  )
}
