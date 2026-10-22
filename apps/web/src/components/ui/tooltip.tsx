import { Tooltip as T } from 'radix-ui'
import type { ReactNode } from 'react'

export const TooltipProvider = T.Provider

export function Tooltip({ label, children, side = 'top' }: { label: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <T.Root delayDuration={300}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-72 rounded-[4px] bg-shade px-2 py-1 text-[12px] leading-snug text-white shadow-md data-[state=delayed-open]:animate-[fade-in_100ms_ease-out]"
        >
          {label}
        </T.Content>
      </T.Portal>
    </T.Root>
  )
}
