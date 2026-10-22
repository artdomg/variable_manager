import { Dialog as D } from 'radix-ui'
import { X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close

export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: ComponentProps<typeof D.Content> & { title: string; description?: ReactNode }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-40 bg-shade/40 data-[state=open]:animate-[fade-in_150ms_ease-out]" />
      <D.Content
        className={cn(
          'fixed top-[12vh] left-1/2 z-50 w-[calc(100vw-32px)] max-w-[440px] -translate-x-1/2 rounded-[8px] border border-line bg-ground p-5 shadow-[0_18px_48px_-12px_rgb(15_20_45/0.35)] focus:outline-none data-[state=open]:animate-[dialog-in_180ms_cubic-bezier(0.16,1,0.3,1)]',
          className,
        )}
        {...props}
      >
        <div className="mb-4 pr-8">
          <D.Title className="text-[15px] font-semibold text-ink">{title}</D.Title>
          {description ? (
            <D.Description className="mt-1 text-[13px] leading-relaxed text-muted">{description}</D.Description>
          ) : (
            <D.Description className="sr-only">{title}</D.Description>
          )}
        </div>
        {children}
        <D.Close
          className="absolute top-4 right-4 grid size-7 place-items-center rounded-[5px] text-muted hover:bg-panel hover:text-ink focus-visible:outline-2 focus-visible:outline-focus"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </D.Close>
      </D.Content>
    </D.Portal>
  )
}
