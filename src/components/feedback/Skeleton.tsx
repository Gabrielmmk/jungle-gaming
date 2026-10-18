import { cn } from '@/lib/utils'

/**
 * Bloco de skeleton com efeito shimmer. A animação respeita
 * `prefers-reduced-motion` via a classe `motion-safe:animate-shimmer` —
 * usuários que pediram menos movimento veem um bloco estático (ainda
 * assim comunicando "carregando" pela cor/opacidade), sem a varredura de
 * brilho. Dimensões/raio são controlados via `className` por quem usa.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden rounded-md bg-surface-dark',
        'motion-safe:before:absolute motion-safe:before:inset-0',
        'motion-safe:before:-translate-x-full motion-safe:before:animate-shimmer',
        'motion-safe:before:bg-gradient-to-r motion-safe:before:from-transparent motion-safe:before:via-border-soft/40 motion-safe:before:to-transparent',
        className,
      )}
    />
  )
}
