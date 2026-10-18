import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetPortal = DialogPrimitive.Portal

function SheetOverlay({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay className={cn('fixed inset-0 z-50 bg-ink/80', className)} {...props} />
  )
}

/**
 * Drawer lateral (mobile). Radix `Dialog` já cuida do focus trap, fechar
 * no Escape e restaurar o foco ao fechar — reaproveitado em vez de
 * reimplementar essa lógica de acessibilidade.
 */
function SheetContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-full max-w-xs flex-col gap-4 overflow-y-auto border-r border-border-soft bg-ink p-6 text-text-primary shadow-lg',
          'focus:outline-none',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <X className="size-5" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />
}

function SheetTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-body-lg font-medium text-text-primary', className)}
      {...props}
    />
  )
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle }
