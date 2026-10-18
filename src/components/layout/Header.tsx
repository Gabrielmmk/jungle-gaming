import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  /**
   * Slot para o `SearchBox` (Task 9). Mantido como prop em vez de import
   * direto para não acoplar o layout compartilhado ao recurso de busca —
   * quem compõe a página decide o que entra aqui.
   */
  search?: ReactNode
}

/**
 * Link para seções fora do escopo desta camada (Criadores, Aprenda).
 * Em vez de apontar para uma rota que não existe (fake 404) ou simular
 * uma funcionalidade que não existe, é um link desabilitado visualmente
 * com `aria-disabled` e um rótulo "em breve" — comunica honestamente que
 * a seção ainda não está disponível, sem fingir sucesso.
 */
function ComingSoonLink({ label }: { label: string }) {
  return (
    <span
      aria-disabled="true"
      title={`${label} — em breve`}
      className="cursor-not-allowed text-body text-text-secondary/50"
    >
      {label}
      <span className="ml-1 text-tiny uppercase tracking-wide text-text-secondary/40">
        em breve
      </span>
    </span>
  )
}

export function Header({ search }: HeaderProps) {
  return (
    <header className="border-b border-border bg-ink">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-6 md:justify-start">
          <Link
            to="/"
            className="text-body-lg font-semibold tracking-wide text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            GreenMint
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-center gap-5 md:flex">
            <Link
              to="/"
              className="text-body text-text-primary hover:text-text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              activeProps={{ className: 'text-text-accent' }}
            >
              Início
            </Link>
            <Link
              to="/"
              className="text-body text-text-primary hover:text-text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Mercado
            </Link>
            <ComingSoonLink label="Criadores" />
            <ComingSoonLink label="Aprenda" />
          </nav>
        </div>

        {search && <div className="w-full md:max-w-md md:flex-1">{search}</div>}

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            aria-label="Carrinho, 0 itens"
            className="relative rounded-md p-2 text-text-primary hover:bg-surface-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ShoppingCart aria-hidden="true" className="size-5" />
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium leading-none text-ink"
            >
              0
            </span>
          </button>

          {/*
            `/login` ainda não existe como rota (chega em uma camada
            futura de autenticação). Usamos uma âncora comum em vez do
            `Link` tipado do router — navegar para lá cai no 404 global
            (ver `routes/__root.tsx`), o que é aceitável nesta camada e
            não finge uma funcionalidade que não existe.
          */}
          <Button asChild variant="default" size="sm">
            <a href="/login">Entrar</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
