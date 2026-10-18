import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthDialog } from '@/features/auth/AuthDialog'
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
 * componente abre um `Dialog` (Radix) pedindo login, em vez de fingir que o
 * favorito foi salvo. O Radix cuida de focus trap, Escape e devolução de
 * foco ao botão que disparou o dialog — nada disso é reimplementado aqui.
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

      <AuthDialog
        open={showLoginPrompt}
        onOpenChange={(open) => {
          if (!open) dismissLoginPrompt()
        }}
        description="Entre ou crie sua conta para salvar NFTs nos favoritos."
      />
    </>
  )
}
