import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

/** An entity's security-tint swatch. */
export function TintSwatch({ tint, className, style }: { tint: number; className?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className={cn('tint size-3.5 border border-current/35', `tint-${tint}`, className)}
      style={style}
    />
  )
}

/** Hides `length` characters of a value under the entity's tint. */
export function TintStrip({ tint, length, className }: { tint: number; length: number; className?: string }) {
  // Proportional to the hidden text, clamped so short and very long values stay legible as shapes.
  const width = Math.min(Math.max(length, 4), 36) * 0.62
  return (
    <span
      aria-hidden
      className={cn('tint h-[1.05em] border border-current/25 align-[-0.15em]', `tint-${tint}`, className)}
      style={{ width: `${width}em` }}
    />
  )
}
