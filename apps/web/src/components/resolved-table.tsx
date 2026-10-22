import type { ReferenceError } from '@vm/core'
import { Copy, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TintStrip } from '@/components/tint'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { ReferenceChip, type CatalogEntity } from '@/components/value-display'
import { useCopy } from '@/lib/clipboard'
import { useDescribeReferenceError } from '@/lib/describe-errors'
import { cn } from '@/lib/utils'

export interface ResolvedRow {
  key: string
  value: string
  references: string[]
  errors: ReferenceError[]
}

/** Final values with every reference substituted, plus where each came from. */
export function ResolvedTable({
  entity,
  rows,
  catalog,
  revealAll,
}: {
  entity: { projectId: string; name: string; tint: number }
  rows: ResolvedRow[]
  catalog: CatalogEntity[]
  revealAll: boolean
}) {
  const { t } = useTranslation()
  const copy = useCopy()
  const describe = useDescribeReferenceError()
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  if (rows.length === 0) {
    return <p className="px-4 py-6 text-[13px] text-muted md:px-8">{t('resolved.noVariables')}</p>
  }

  return (
    <div role="table" aria-label={t('resolved.tableLabel', { name: entity.name })}>
      <div
        role="row"
        className="hidden h-8 items-center border-b border-line px-8 font-mono text-[11px] font-medium tracking-[0.08em] text-muted uppercase @3xl:grid @3xl:grid-cols-[minmax(180px,0.8fr)_minmax(0,2fr)_minmax(0,1fr)_72px]"
      >
        <span role="columnheader">{t('variables.columns.key')}</span>
        <span role="columnheader" className="pl-3">
          {t('variables.columns.resolved')}
        </span>
        <span role="columnheader" className="pl-3">
          {t('variables.columns.origin')}
        </span>
        <span role="columnheader" className="sr-only">
          {t('variables.columns.actions')}
        </span>
      </div>
      {rows.map((row) => {
        const shown = revealAll || revealed.has(row.key)
        const broken = row.errors.length > 0
        const toggle = () =>
          setRevealed((current) => {
            const next = new Set(current)
            if (next.has(row.key)) next.delete(row.key)
            else next.add(row.key)
            return next
          })
        return (
          <div
            key={row.key}
            role="row"
            className={cn(
              'grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b border-line px-4 py-2.5 @lg:grid-cols-[176px_minmax(0,1fr)_72px] @lg:gap-x-0 @3xl:grid-cols-[minmax(180px,0.8fr)_minmax(0,2fr)_minmax(0,1fr)_72px] @3xl:items-center @3xl:gap-y-0 md:px-8',
              broken ? 'bg-danger-soft/70' : 'hover:bg-envelope-soft',
            )}
          >
            <div role="cell" className="min-w-0 truncate font-mono font-bold text-ink">
              {row.key}
            </div>
            <div role="cell" className="col-span-2 row-start-2 min-w-0 @lg:col-span-1 @lg:col-start-2 @lg:row-start-1 @lg:pl-3 @3xl:col-start-auto @3xl:row-start-auto">
              {row.value === '' ? (
                <span className="text-muted italic">{t('common.empty')}</span>
              ) : (
                <button type="button" tabIndex={-1} aria-hidden onClick={toggle} className="relative grid max-w-full cursor-pointer grid-cols-[minmax(0,1fr)] text-left font-mono">
                  <span
                    className={cn(
                      'col-start-1 row-start-1',
                      // Hidden text must not reserve wrapped lines under the one-line tint strip.
                      shown ? 'break-all whitespace-pre-wrap' : 'truncate whitespace-pre opacity-0 select-none',
                    )}
                  >
                    {row.value}
                  </span>
                  <span className="tint-cover col-start-1 row-start-1 flex min-w-0 items-center overflow-hidden" data-lifted={shown}>
                    <TintStrip tint={entity.tint} length={row.value.length} className="max-w-full" />
                  </span>
                </button>
              )}
              {broken && (
                <ul className="mt-1 grid gap-0.5 text-[12.5px] text-danger">
                  {row.errors.map((error) => (
                    <li key={`${error.kind}-${error.target}`}>{describe(error)}</li>
                  ))}
                </ul>
              )}
            </div>
            <div
              role="cell"
              className={cn(
                'col-span-2 row-start-3 flex min-w-0 flex-wrap gap-1 @lg:col-span-1 @lg:col-start-2 @lg:row-start-2 @lg:pl-3 @3xl:col-start-auto @3xl:row-start-auto',
                // Provenance only earns a line when something was substituted.
                row.references.length === 0 && 'hidden @3xl:flex',
              )}
            >
              {row.references.length === 0 ? (
                <span className="font-mono text-[11.5px] text-muted">{t('resolved.literal')}</span>
              ) : (
                [...new Set(row.references)].map((ref) => {
                  const [entityName, key] = ref.split('.') as [string, string]
                  return (
                    <ReferenceChip key={ref} entity={entityName} variable={key} catalog={catalog} projectId={entity.projectId} />
                  )
                })
              )}
            </div>
            <div role="cell" className="col-start-2 row-start-1 flex justify-end gap-0.5 text-muted @lg:col-start-3 @3xl:col-start-auto @3xl:row-start-auto">
              <Tooltip label={shown ? t('variables.actions.hide') : t('variables.actions.show')}>
                <Button variant="ghost" size="icon-sm" onClick={toggle} aria-label={t(shown ? 'variables.actions.hideKey' : 'variables.actions.showKey', { key: row.key })}>
                  {shown ? <EyeOff /> : <Eye />}
                </Button>
              </Tooltip>
              <Tooltip label={t('variables.actions.copyResolved')}>
                <Button variant="ghost" size="icon-sm" aria-label={t('variables.actions.copyKey', { key: row.key })} onClick={() => copy(row.value, row.key)}>
                  <Copy />
                </Button>
              </Tooltip>
            </div>
          </div>
        )
      })}
    </div>
  )
}
