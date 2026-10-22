import { Link } from '@tanstack/react-router'
import { findReferences } from '@vm/core'
import { Fragment } from 'react'
import { TintStrip, TintSwatch } from '@/components/tint'
import { cn } from '@/lib/utils'

export interface CatalogEntity {
  id: string
  name: string
  tint: number
  keys: string[]
}

type Segment = { type: 'text'; text: string } | { type: 'ref'; entity: string; key: string; match: string }

function segmentsOf(value: string): Segment[] {
  const segments: Segment[] = []
  let cursor = 0
  for (const ref of findReferences(value)) {
    if (ref.start > cursor) segments.push({ type: 'text', text: value.slice(cursor, ref.start) })
    segments.push({ type: 'ref', entity: ref.entity, key: ref.key, match: ref.match })
    cursor = ref.end
  }
  if (cursor < value.length) segments.push({ type: 'text', text: value.slice(cursor) })
  return segments
}

/**
 * Renders a raw value: literal text (hidden under the entity's tint unless
 * revealed) and `${{entity.KEY}}` references as chips carrying the target's tint.
 */
export function ValueDisplay({
  value,
  tint,
  revealed,
  catalog,
  projectId,
}: {
  value: string
  tint: number
  revealed: boolean
  catalog: CatalogEntity[]
  projectId: string
}) {
  if (value === '') return <span className="font-sans text-muted italic">vacío</span>

  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-0.5 gap-y-1 font-mono">
      {segmentsOf(value).map((segment, i) => {
        if (segment.type === 'ref') {
          return (
            <ReferenceChip
              key={i}
              entity={segment.entity}
              variable={segment.key}
              catalog={catalog}
              projectId={projectId}
            />
          )
        }
        return (
          <Fragment key={i}>
            <span className="relative inline-grid max-w-full min-w-0 grid-cols-[minmax(0,auto)] align-middle">
              <span
                className={cn(
                  'col-start-1 row-start-1 truncate whitespace-pre transition-opacity duration-200',
                  !revealed && 'opacity-0 select-none',
                )}
                aria-hidden={!revealed}
              >
                {segment.text}
              </span>
              <span className="tint-cover col-start-1 row-start-1 flex min-w-0 items-center overflow-hidden" data-lifted={revealed}>
                <TintStrip tint={tint} length={segment.text.length} className="max-w-full" />
                <span className="sr-only">valor oculto</span>
              </span>
            </span>
          </Fragment>
        )
      })}
    </span>
  )
}

export function ReferenceChip({
  entity,
  variable,
  catalog,
  projectId,
}: {
  entity: string
  variable: string
  catalog: CatalogEntity[]
  projectId: string
}) {
  const target = catalog.find((e) => e.name === entity)
  const broken = !target || !target.keys.includes(variable)
  const label = (
    <>
      {target ? <TintSwatch tint={target.tint} className="size-3" /> : <span className="size-3 border border-dashed border-danger" />}
      <span className="truncate">
        <b className="font-bold">{entity}</b>.{variable}
      </span>
    </>
  )
  const chip = cn(
    'inline-flex h-[22px] max-w-full items-center gap-1.5 border px-1.5 font-mono text-[12.5px] leading-none',
    broken
      ? 'border-danger/60 bg-danger-soft text-danger'
      : 'border-[#c7cee6] bg-envelope-soft text-tint hover:border-tint/60 hover:bg-envelope',
  )
  if (!target) return <span className={chip}>{label}</span>
  return (
    <Link
      to="/proyectos/$projectId/$entityId"
      params={{ projectId, entityId: target.id }}
      search={{ vista: 'variables', clave: variable }}
      className={chip}
      title={broken ? `«${entity}» no tiene «${variable}»` : `Ir a ${entity}.${variable}`}
    >
      {label}
    </Link>
  )
}
