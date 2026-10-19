import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 767px)' // abaixo do breakpoint `md` do Tailwind (768px)

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/**
 * Decide qual das duas variantes de tela (mobile/desktop) montar. Usado em
 * telas com layouts substancialmente diferentes por viewport (não apenas
 * reflow) — a alternativa de esconder as duas via CSS deixaria landmarks,
 * labels e `data-testid`s duplicados no DOM (quebra a11y e testes e2e).
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
