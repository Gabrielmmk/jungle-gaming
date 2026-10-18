import { type ReactNode } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AuthForm } from '@/features/auth/AuthForm'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: 'login' | 'register'
  description?: string
}

/**
 * Apresentação em modal do formulário de auth (híbrido rota + modal),
 * usada quando o login é disparado de dentro de um fluxo (ex.: favoritar).
 * O Dialog (Radix) fornece focus trap, Escape e retorno de foco.
 */
export function AuthDialog({
  open,
  onOpenChange,
  defaultMode = 'login',
  description = 'Entre ou crie sua conta para continuar.',
}: AuthDialogProps): ReactNode {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-none bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">Autenticação</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <AuthForm defaultMode={defaultMode} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
