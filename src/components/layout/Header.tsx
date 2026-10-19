import { useState, type ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { LogIn, Search, ShoppingCart, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/useSession'
import { useCartCount } from '@/features/cart/useCartCount'
import { AuthDialog } from '@/features/auth/AuthDialog'

const NAV_LINK_CLASSNAME =
  'border-b-2 border-transparent pb-2.5 text-body-lg text-text-primary hover:text-text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
const NAV_LINK_ACTIVE_CLASSNAME = 'border-primary font-bold text-text-accent'

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
      className="cursor-not-allowed border-b-2 border-transparent pb-2.5 text-body-lg text-text-secondary/50"
    >
      {label}
    </span>
  )
}

export function Header({ search }: HeaderProps) {
  const { isAuthenticated, user } = useSession()
  const cartCount = useCartCount()
  const [searchOpen, setSearchOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  // A navegação de um NFT (`/nft/$id`) não é descendente de `/mercado` na
  // árvore de rotas, então o `activeProps` padrão do Router (baseado em
  // prefixo de rota) nunca marcaria "Mercado" como ativo lá — mesmo o
  // produto pertencendo à seção Mercado. Resolvido à mão pelo pathname.
  const pathname = useLocation({ select: (location) => location.pathname })
  const isMercadoSection = pathname === '/mercado' || pathname.startsWith('/nft/')

  return (
    <header className="border-b border-border bg-ink">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-6">
        <div className="flex items-center justify-between gap-6 md:justify-start">
          <Link
            to="/"
            className="text-body-lg font-bold uppercase tracking-wide text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            GreenMint
          </Link>
        </div>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center justify-center gap-9 md:flex"
        >
          <Link
            to="/"
            className={`${NAV_LINK_CLASSNAME} ${pathname === '/' ? NAV_LINK_ACTIVE_CLASSNAME : ''}`}
          >
            Início
          </Link>
          <Link
            to="/mercado"
            className={`${NAV_LINK_CLASSNAME} ${isMercadoSection ? NAV_LINK_ACTIVE_CLASSNAME : ''}`}
          >
            Mercado
          </Link>
          <ComingSoonLink label="Criadores" />
          <ComingSoonLink label="Aprenda" />
        </nav>

        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-end md:gap-5">
          {search &&
            (searchOpen ? (
              <div className="flex w-full items-center gap-2 md:max-w-xs">
                <div className="flex-1">{search}</div>
                <button
                  type="button"
                  aria-label="Fechar busca"
                  onClick={() => setSearchOpen(false)}
                  className="shrink-0 rounded-md p-2 text-text-primary hover:bg-surface-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                aria-label="Abrir busca"
                onClick={() => setSearchOpen(true)}
                className="self-end rounded-md p-2 text-text-primary hover:bg-surface-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:self-auto"
              >
                <Search aria-hidden="true" className="size-5" />
              </button>
            ))}

          <div className="flex items-center justify-end gap-4">
            <Link
              to="/cart"
              aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
              className="relative rounded-md p-2 text-text-primary hover:bg-surface-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ShoppingCart aria-hidden="true" className="size-5" />
              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1.5 -top-1.5 flex size-[18px] items-center justify-center rounded-full bg-primary text-[11px] font-semibold leading-none text-ink"
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-body text-text-primary hover:bg-surface-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                activeProps={{ className: 'text-text-accent' }}
              >
                <UserRound aria-hidden="true" className="size-4" />
                <span className="max-w-[10ch] truncate">{user?.displayName ?? 'Minha conta'}</span>
              </Link>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="rounded-lg"
                onClick={() => setAuthOpen(true)}
              >
                <LogIn aria-hidden="true" className="size-4" />
                Entrar
              </Button>
            )}
          </div>
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  )
}
