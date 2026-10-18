import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavorites } from '@/features/favorites/useFavorites'

interface FavoriteButtonProps {
  id: string
}

/**
 * Botão de favoritar. O estado "favoritado" é comunicado por `aria-pressed`
 * (estado semântico, não apenas visual) e por ícone com preenchimento +
 * rótulo de texto — não depende só de cor para ser percebido.
 *
 * Quando não há sessão (`useFavorites().isAuthenticated === false`), o
 * clique não chama a API: `toggleFavorite` liga `showLoginPrompt`, e este
 * componente renderiza um dialog simples pedindo login, em vez de fingir
 * que o favorito foi salvo.
 */
export function FavoriteButton({ id }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, showLoginPrompt, dismissLoginPrompt } = useFavorites()
  const favorited = isFavorite(id)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-pressed={favorited}
        onClick={() => toggleFavorite(id)}
      >
        <Heart aria-hidden="true" className={favorited ? 'fill-primary text-primary' : ''} />
        {favorited ? 'Favoritado' : 'Favoritar'}
      </Button>

      {showLoginPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="favorite-login-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-6"
        >
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border-soft bg-surface-card p-6">
            <p id="favorite-login-title" className="text-body-lg font-medium text-text-primary">
              Faça login para favoritar
            </p>
            <p className="text-body text-text-secondary">
              Você precisa estar conectado para salvar NFTs nos favoritos.
            </p>
            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={dismissLoginPrompt}>
                Agora não
              </Button>
              {/*
                `/login` ainda não existe como rota nesta camada (ver
                mesma nota em `Header.tsx`) — âncora comum em vez do
                `Link` tipado, cai no 404 global, o que é aceitável aqui.
              */}
              <Button asChild type="button" variant="default" size="sm">
                <a href="/login">Entrar</a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
