import { useEffect } from 'react'

const BASE = 'GreenMint'
const DEFAULT = 'GreenMint — Marketplace de NFTs de arte digital'

/**
 * Define o `document.title` da rota atual (SEO/UX) e restaura o título
 * padrão ao desmontar. Passe `null` enquanto o dado ainda carrega para
 * manter o título atual.
 */
export function useDocumentTitle(title: string | null): void {
  useEffect(() => {
    if (title) document.title = `${title} · ${BASE}`
    return () => {
      document.title = DEFAULT
    }
  }, [title])
}
