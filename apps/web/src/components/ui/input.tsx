import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const fieldClass =
  'w-full rounded-[5px] border border-line-strong bg-ground px-2.5 text-[13px] text-ink placeholder:text-muted transition-[border-color,box-shadow] duration-150 focus:border-accent focus:outline-none focus:ring-3 focus:ring-focus/25 aria-invalid:border-danger aria-invalid:ring-danger/20 disabled:opacity-60'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(fieldClass, 'h-8', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(fieldClass, 'min-h-20 py-2 leading-relaxed', className)} {...props} />
}

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('text-[12px] font-semibold text-ink', className)} {...props} />
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null
  return (
    <p role="alert" className="text-[12px] text-danger">
      {children}
    </p>
  )
}
