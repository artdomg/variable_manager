import { DropdownMenu as M } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const Menu = M.Root
export const MenuTrigger = M.Trigger

export function MenuContent({ className, ...props }: ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        sideOffset={4}
        align="end"
        className={cn(
          'z-50 min-w-44 rounded-[6px] border border-line bg-ground p-1 shadow-[0_10px_30px_-10px_rgb(15_20_45/0.3)] data-[state=open]:animate-[fade-in_120ms_ease-out]',
          className,
        )}
        {...props}
      />
    </M.Portal>
  )
}

export function MenuItem({ className, tone, ...props }: ComponentProps<typeof M.Item> & { tone?: 'danger' }) {
  return (
    <M.Item
      className={cn(
        'flex cursor-default items-center gap-2 rounded-[4px] px-2 py-1.5 text-[13px] text-ink outline-none select-none data-highlighted:bg-panel [&_svg]:size-4 [&_svg]:text-muted',
        tone === 'danger' && 'text-danger data-highlighted:bg-danger/10 [&_svg]:text-danger',
        className,
      )}
      {...props}
    />
  )
}

export const MenuSeparator = () => <M.Separator className="my-1 h-px bg-line" />

export function MenuLabel({ className, ...props }: ComponentProps<typeof M.Label>) {
  return (
    <M.Label
      className={cn('px-2 pt-1.5 pb-1 font-mono text-[11px] font-medium tracking-[0.08em] text-muted uppercase', className)}
      {...props}
    />
  )
}
