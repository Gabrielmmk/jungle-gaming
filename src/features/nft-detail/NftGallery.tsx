import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NftGalleryProps {
  name: string
  images: string[]
}

/**
 * Galeria do detalhe: coluna de miniaturas + imagem principal. As
 * miniaturas são `button`s nativos (focáveis e operáveis por Enter/Espaço
 * sem handler extra) organizadas num `role="tablist"` simples — as setas
 * ↑/↓ movem a seleção entre miniaturas, replicando o padrão de
 * navegação por teclado esperado para um grupo de seleção única.
 */
export function NftGallery({ name, images }: NftGalleryProps) {
  const [selected, setSelected] = useState(0)
  const safeImages = images.length > 0 ? images : []
  const activeIndex = Math.min(selected, Math.max(safeImages.length - 1, 0))

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      setSelected((index + 1) % safeImages.length)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      setSelected((index - 1 + safeImages.length) % safeImages.length)
    }
  }

  if (safeImages.length === 0) {
    return (
      <div className="aspect-square w-full rounded-lg border border-border-soft bg-surface-dark" />
    )
  }

  return (
    <div className="flex gap-3">
      <div
        role="tablist"
        aria-label="Miniaturas do NFT"
        aria-orientation="vertical"
        className="flex flex-col gap-2"
      >
        {safeImages.map((src, index) => (
          <button
            key={src + index}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'size-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
              index === activeIndex ? 'border-primary' : 'border-border-soft hover:border-text-secondary',
            )}
          >
            <img
              src={src}
              alt={`${name} — miniatura ${index + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      <div className="aspect-square w-full flex-1 overflow-hidden rounded-lg bg-surface-dark">
        <img
          key={activeIndex}
          src={safeImages[activeIndex]}
          alt={`${name} — imagem ${activeIndex + 1}`}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  )
}
