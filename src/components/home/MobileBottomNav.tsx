import { Link, useLocation } from '@tanstack/react-router'
import { Home, Heart, ShoppingCart, UserRound, ScanLine } from 'lucide-react'
import { useSession } from '@/features/auth/useSession'
import { useCartCount } from '@/features/cart/useCartCount'

/**
 * Navegação inferior fixa da Início no mobile (Figma): início/favoritos/
 * carrinho/perfil + botão flutuante central. Só usada nesta tela (ver
 * decisão em conversa — não vira chrome global do site).
 *
 * "Favoritos" não tem uma rota de listagem nesta camada (favoritar é
 * por item, ver `NftCardFavorite`/`FavoriteButton`) — mesmo tratamento
 * "em breve" usado para Criadores/Aprenda no Header e no menu da conta.
 * O botão central (scan) também é apresentacional: sem uma feature real
 * por trás, não finge abrir algo — mesmo padrão.
 */
export function MobileBottomNav() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { isAuthenticated } = useSession()
  const cartCount = useCartCount()

  return (
    <nav
      aria-label="Navegação principal (mobile)"
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-border-soft bg-surface-dark px-8 py-3 md:hidden"
    >
      <Link
        to="/"
        aria-label="Início"
        aria-current={pathname === '/' ? 'page' : undefined}
        className="flex items-center justify-center text-text-primary [&.active]:text-primary"
        activeProps={{ className: 'active' }}
      >
        <Home aria-hidden="true" className="size-6" />
      </Link>

      <span
        aria-disabled="true"
        title="Favoritos — em breve"
        className="flex cursor-not-allowed items-center justify-center text-text-secondary/50"
      >
        <Heart aria-hidden="true" className="size-6" />
      </span>

      <button
        type="button"
        aria-disabled="true"
        title="Em breve"
        className="absolute left-1/2 top-0 flex size-14 -translate-x-1/2 -translate-y-1/2 cursor-not-allowed items-center justify-center rounded-full border-4 border-ink bg-primary text-ink"
      >
        <ScanLine aria-hidden="true" className="size-6" />
      </button>

      <Link
        to="/cart"
        aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
        className="relative flex items-center justify-center text-text-primary [&.active]:text-primary"
        activeProps={{ className: 'active' }}
      >
        <ShoppingCart aria-hidden="true" className="size-6" />
        {cartCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 flex size-[16px] items-center justify-center rounded-full bg-primary text-[10px] font-semibold leading-none text-ink"
          >
            {cartCount}
          </span>
        )}
      </Link>

      <Link
        to={isAuthenticated ? '/profile' : '/login'}
        aria-label="Minha conta"
        className="flex items-center justify-center text-text-primary [&.active]:text-primary"
        activeProps={{ className: 'active' }}
      >
        <UserRound aria-hidden="true" className="size-6" />
      </Link>
    </nav>
  )
}
