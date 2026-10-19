import { Heart } from 'lucide-react'
import { AuthDialog } from '@/features/auth/AuthDialog'
import { useFavorites } from '@/features/favorites/useFavorites'

/**
 * Botão de favoritar sobreposto à imagem do card (variante compacta do
 * `FavoriteButton` da tela de detalhe). Fica dentro de um `Link` (o
 * card inteiro navega para o NFT), então o clique precisa impedir a
 * navegação e a propagação antes de alternar o favorito.
 */
export function NftCardFavorite({ id }: { id: string }) {
  const { isFavorite, toggleFavorite, showLoginPrompt, dismissLoginPrompt } = useFavorites()
  const favorited = isFavorite(id)

  return (
    <>
      <button
        type="button"
        aria-pressed={favorited}
        aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleFavorite(id)
        }}
        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-ink/60 text-text-primary backdrop-blur-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Heart aria-hidden="true" className={`size-4 ${favorited ? 'fill-primary text-primary' : ''}`} />
      </button>

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
