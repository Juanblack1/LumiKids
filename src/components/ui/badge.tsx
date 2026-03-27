import * as React from 'react'

import { cn } from '@/lib/utils'

function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-ink backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
