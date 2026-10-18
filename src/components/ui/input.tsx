import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-md border border-border-soft bg-ink px-3 py-2 font-mono text-body text-text-primary',
        'placeholder:text-text-secondary/60 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-red-500',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
