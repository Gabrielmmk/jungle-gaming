import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNftSearch } from '@/features/discovery/useNftSearch'

interface PaginationProps {
  total: number
  pageSize: number
}

/**
 * Paginação numerada derivada de `total`/`pageSize`. Botões são <button>
 * nativos (operáveis por teclado por padrão) dentro de uma <nav>;
 * `aria-current="page"` marca a página ativa para leitores de tela.
 */
export function Pagination({ total, pageSize }: PaginationProps) {
  const { search, setSearch } = useNftSearch()
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(search.page, pageCount)

  if (pageCount <= 1) return null

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1)

  const goTo = (page: number) => {
    if (page < 1 || page > pageCount || page === currentPage) return
    setSearch({ page })
  }

  return (
    <nav aria-label="Paginação" data-testid="pagination" className="flex items-center justify-center gap-1">
      <button
        type="button"
        aria-label="Página anterior"
        disabled={currentPage === 1}
        onClick={() => goTo(currentPage - 1)}
        className="rounded-md p-2 text-text-primary hover:bg-surface-card disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          aria-current={page === currentPage ? 'page' : undefined}
          onClick={() => goTo(page)}
          className={cn(
            'min-w-9 rounded-md px-3 py-2 text-body text-text-primary hover:bg-surface-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            page === currentPage && 'bg-primary text-ink hover:bg-primary/90',
          )}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        aria-label="Próxima página"
        disabled={currentPage === pageCount}
        onClick={() => goTo(currentPage + 1)}
        className="rounded-md p-2 text-text-primary hover:bg-surface-card disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}
