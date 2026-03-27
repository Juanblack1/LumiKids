import * as React from 'react'

import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-12 w-full rounded-[22px] border border-soft-border bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none transition focus-visible:border-coral focus-visible:ring-2 focus-visible:ring-coral/30',
        className,
      )}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export { Input }
