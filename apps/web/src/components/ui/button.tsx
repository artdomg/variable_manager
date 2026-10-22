import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[5px] text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-ink shadow-[0_1px_0_rgb(0_0_0/0.12)] hover:bg-accent-hover',
        secondary: 'border border-line-strong bg-ground text-ink hover:bg-panel',
        ghost: 'text-ink hover:bg-panel',
        danger: 'bg-danger text-white hover:bg-danger/90',
        link: 'h-auto px-0 text-accent underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-7 px-2.5 text-[12px]',
        md: 'h-8 px-3',
        lg: 'h-10 px-4 text-[14px]',
        icon: 'size-8',
        'icon-sm': 'size-7',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button'
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
