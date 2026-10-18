import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'

import { cn } from '@/lib/utils'

function Slider({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-dark">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {(props.value ?? props.defaultValue ?? [0]).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block size-4 rounded-full border border-primary bg-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
