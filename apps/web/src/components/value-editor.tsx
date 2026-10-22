import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { TintSwatch } from '@/components/tint'
import { fieldClass } from '@/components/ui/input'
import type { CatalogEntity } from '@/components/value-display'
import { cn } from '@/lib/utils'

/** Text before the caret that opens a reference: `${{` plus a partial `entity.KEY`. */
const OPEN_REFERENCE = /\$\{\{\s*([A-Za-z0-9_.-]*)$/

interface Suggestion {
  entity: string
  tint: number
  key: string
}

/**
 * Auto-growing value editor. Typing `${{` lists `entity.KEY` pairs from the
 * project; Enter or Tab inserts the reference. Enter alone saves, Shift+Enter
 * adds a line, Escape cancels.
 */
export function ValueEditor({
  value,
  onChange,
  onSubmit,
  onCancel,
  catalog,
  exclude,
  id,
  invalid,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  catalog: CatalogEntity[]
  /** `entity.KEY` of the variable being edited, so it never suggests itself. */
  exclude?: string
  id?: string
  invalid?: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [caret, setCaret] = useState(value.length)
  const [active, setActive] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value])

  const query = useMemo(() => OPEN_REFERENCE.exec(value.slice(0, caret))?.[1], [value, caret])

  const suggestions = useMemo<Suggestion[]>(() => {
    if (query === undefined || dismissed) return []
    const needle = query.toLowerCase()
    const all = catalog.flatMap((e) => e.keys.map((key) => ({ entity: e.name, tint: e.tint, key })))
    return all
      .filter((s) => `${s.entity}.${s.key}` !== exclude)
      .filter((s) => `${s.entity}.${s.key}`.toLowerCase().includes(needle))
      .sort((a, b) => Number(!`${a.entity}.${a.key}`.toLowerCase().startsWith(needle)) - Number(!`${b.entity}.${b.key}`.toLowerCase().startsWith(needle)))
      .slice(0, 8)
  }, [query, catalog, exclude, dismissed])

  const open = suggestions.length > 0

  const accept = (s: Suggestion) => {
    const before = value.slice(0, caret).replace(OPEN_REFERENCE, '${{')
    const after = value.slice(caret).replace(/^[A-Za-z0-9_.-]*\s*(\}\})?/, '')
    const insert = `${s.entity}.${s.key}}}`
    const next = before + insert + after
    const position = before.length + insert.length
    onChange(next)
    requestAnimationFrame(() => {
      ref.current?.setSelectionRange(position, position)
      setCaret(position)
    })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const step = e.key === 'ArrowDown' ? 1 : -1
        setActive((i) => (i + step + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        accept(suggestions[Math.min(active, suggestions.length - 1)]!)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setDismissed(true)
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  const listId = `${id ?? 'value'}-suggestions`

  return (
    <div className="relative">
      <textarea
        ref={ref}
        id={id}
        rows={1}
        value={value}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        placeholder={'valor, o ${{entidad.VARIABLE}}'}
        aria-invalid={invalid}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className={cn(fieldClass, 'block min-h-8 resize-none overflow-hidden py-[6px] font-mono leading-[18px] break-all')}
        onChange={(e) => {
          onChange(e.target.value)
          setCaret(e.target.selectionStart)
          setActive(0)
          setDismissed(false)
        }}
        onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
        onKeyDown={onKeyDown}
        onBlur={() => setDismissed(true)}
        onFocus={() => setDismissed(false)}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full left-0 z-20 mt-1 max-h-64 w-full min-w-64 overflow-y-auto rounded-[6px] border border-line bg-ground p-1 shadow-[0_10px_30px_-10px_rgb(15_20_45/0.3)]"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.entity}.${s.key}`}
              role="option"
              aria-selected={i === active}
              className={cn(
                'flex cursor-default items-center gap-2 rounded-[4px] px-2 py-1.5 font-mono text-[12.5px] text-ink',
                i === active && 'bg-envelope text-tint',
              )}
              onMouseDown={(e) => {
                e.preventDefault()
                accept(s)
              }}
              onMouseEnter={() => setActive(i)}
            >
              <TintSwatch tint={s.tint} className="size-3" />
              <span className="truncate">
                <b className="font-bold">{s.entity}</b>.{s.key}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
