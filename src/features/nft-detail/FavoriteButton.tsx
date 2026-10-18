import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
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

      <Dialog
        open={showLoginPrompt}
        onOpenChange={(open) => {
          if (!open) dismissLoginPrompt()
        }}
      >
        <DialogContent>
          <DialogTitle>Faça login para favoritar</DialogTitle>
          <DialogDescription>
            Você precisa estar conectado para salvar NFTs nos favoritos.
          </DialogDescription>
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
        </DialogContent>
      </Dialog>
    </>
  )
}
