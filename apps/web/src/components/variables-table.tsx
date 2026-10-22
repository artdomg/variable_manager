import { useMutation } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { isValidVariableKey, parseEnv, type ReferenceError } from '@vm/core'
import { Copy, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type ClipboardEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FieldError, Input } from '@/components/ui/input'
import { Tooltip } from '@/components/ui/tooltip'
import { ValueDisplay, type CatalogEntity } from '@/components/value-display'
import { ValueEditor } from '@/components/value-editor'
import { useCopy } from '@/lib/clipboard'
import { useDescribeReferenceError, useReferenceExample } from '@/lib/describe-errors'
import { useFormat } from '@/lib/format'
import { useInvalidateProject } from '@/lib/invalidate'
import { cn, errorMessage } from '@/lib/utils'
import { deleteVariable, replaceVariables, saveVariable } from '@/server/projects'

export interface VariableRow {
  id: string
  key: string
  value: string
  resolved: string
  references: string[]
  errors: ReferenceError[]
  updatedAt: Date
}

interface Props {
  entity: { id: string; projectId: string; name: string; tint: number }
  variables: VariableRow[]
  catalog: CatalogEntity[]
  revealAll: boolean
  editing: string | null
  onEditingChange: (id: string | null) => void
  highlight?: string
}

export function VariablesTable({ entity, variables, catalog, revealAll, editing, onEditingChange, highlight }: Props) {
  const { t } = useTranslation()
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setRevealed((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  if (variables.length === 0 && editing !== 'new') {
    return <EmptyVariables entityName={entity.name} onAdd={() => onEditingChange('new')} />
  }

  return (
    <div role="table" aria-label={t('variables.tableLabel', { name: entity.name })} className="text-[13px]">
      <div
        role="row"
        className="hidden h-8 items-center border-b border-line px-4 font-mono text-[11px] font-medium tracking-[0.08em] text-muted uppercase @lg:grid @lg:grid-cols-[176px_minmax(0,1fr)_132px] @3xl:grid-cols-[minmax(180px,0.8fr)_minmax(0,2fr)_216px_132px] md:px-8"
      >
        <span role="columnheader">{t('variables.columns.key')}</span>
        <span role="columnheader" className="pl-3">
          {t('variables.columns.value')}
        </span>
        <span role="columnheader" className="hidden pl-3 @3xl:block">
          {t('variables.columns.meta')}
        </span>
        <span role="columnheader" className="sr-only">
          {t('variables.columns.actions')}
        </span>
      </div>

      {variables.map((variable) =>
        editing === variable.id ? (
          <EditRow
            key={variable.id}
            entity={entity}
            catalog={catalog}
            variable={variable}
            current={variables}
            onDone={() => onEditingChange(null)}
          />
        ) : (
          <Row
            key={variable.id}
            entity={entity}
            catalog={catalog}
            variable={variable}
            revealed={revealAll || revealed.has(variable.id)}
            onToggle={() => toggle(variable.id)}
            onEdit={() => onEditingChange(variable.id)}
            highlighted={highlight === variable.key}
          />
        ),
      )}

      {editing === 'new' ? (
        <EditRow
          entity={entity}
          catalog={catalog}
          current={variables}
          onDone={() => onEditingChange(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => onEditingChange('new')}
          className="flex h-11 w-full items-center gap-2 px-4 text-left text-[13px] text-muted transition-colors duration-150 hover:bg-envelope-soft hover:text-tint focus-visible:bg-envelope-soft focus-visible:outline-none md:px-8"
        >
          <Plus className="size-4" />
          <span className="font-medium">{t('variables.add')}</span>
          <span className="hidden font-mono text-[12px] @3xl:inline">· {t('variables.addHint')}</span>
        </button>
      )}
    </div>
  )
}

function Row({
  entity,
  catalog,
  variable,
  revealed,
  onToggle,
  onEdit,
  highlighted,
}: {
  entity: Props['entity']
  catalog: CatalogEntity[]
  variable: VariableRow
  revealed: boolean
  onToggle: () => void
  onEdit: () => void
  highlighted: boolean
}) {
  const { t } = useTranslation()
  const copy = useCopy()
  const { fromNow } = useFormat()
  const describe = useDescribeReferenceError()
  const ref = useRef<HTMLDivElement>(null)
  const invalidate = useInvalidateProject(entity.projectId)
  const remove = useServerFn(deleteVariable)
  const mutation = useMutation({
    mutationFn: () => remove({ data: { entityId: entity.id, variableId: variable.id } }),
    onSuccess: async () => {
      await invalidate()
      toast.success(t('variables.deleted', { key: variable.key }))
    },
    onError: (error) => toast.error(errorMessage(error, t('common.genericError'))),
  })

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ block: 'center' })
  }, [highlighted])

  const broken = variable.errors.length > 0
  const hasLiteral = variable.value.replace(/\$\{\{[^}]*\}\}/g, '').length > 0
  const isPureReference = variable.references.length > 0 && !hasLiteral

  return (
    <div
      ref={ref}
      role="row"
      className={cn(
        'group grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b border-line px-4 py-2.5 transition-colors duration-150 @lg:grid-cols-[176px_minmax(0,1fr)_132px] @lg:items-center @lg:gap-x-0 @lg:gap-y-0 @lg:py-0 @3xl:grid-cols-[minmax(180px,0.8fr)_minmax(0,2fr)_216px_132px] md:px-8',
        broken ? 'bg-danger-soft/70' : 'hover:bg-envelope-soft',
        highlighted && 'animate-[row-in_1600ms_ease-out]',
      )}
    >
      <div role="cell" className="min-w-0 truncate font-mono font-bold tracking-[-0.01em] text-ink @lg:py-3" title={variable.key}>
        {variable.key}
      </div>

      <div role="cell" className="col-span-2 row-start-2 min-w-0 @lg:col-span-1 @lg:row-start-auto @lg:py-2.5 @lg:pl-3">
        <button
          type="button"
          onClick={hasLiteral ? onToggle : undefined}
          tabIndex={-1}
          className={cn('block max-w-full text-left', hasLiteral ? 'cursor-pointer' : 'cursor-default')}
          aria-hidden
        >
          <ValueDisplay
            value={variable.value}
            tint={entity.tint}
            revealed={revealed}
            catalog={catalog}
            projectId={entity.projectId}
          />
        </button>
        {broken && (
          <div className="mt-1.5 flex flex-wrap items-start gap-x-2.5 gap-y-1">
            <span className="@3xl:hidden">
              <BrokenStamp />
            </span>
            <ul className="grid min-w-48 flex-1 gap-0.5 text-[12.5px] text-danger">
              {variable.errors.map((error) => (
                <li key={`${error.kind}-${error.target}`}>{describe(error)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div role="cell" className="hidden min-w-0 truncate font-mono text-[11.5px] text-muted @3xl:block @3xl:pl-3">
        {broken ? (
          <BrokenStamp />
        ) : isPureReference ? (
          <span title={t('variables.meta.resolvedLength', { count: variable.resolved.length })}>
            {t('variables.meta.refs', { count: variable.references.length })} · {fromNow(variable.updatedAt)}
          </span>
        ) : (
          <span>
            {t('variables.meta.chars', { count: variable.value.length })} · {fromNow(variable.updatedAt)}
          </span>
        )}
      </div>

      <div role="cell" className="col-start-2 row-start-1 flex items-center justify-end gap-0.5 text-muted @lg:col-start-auto @lg:row-start-auto @lg:pl-3">
        {hasLiteral && (
          <Tooltip label={revealed ? t('variables.actions.hide') : t('variables.actions.show')}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggle}
              aria-label={t(revealed ? 'variables.actions.hideKey' : 'variables.actions.showKey', { key: variable.key })}
            >
              {revealed ? <EyeOff /> : <Eye />}
            </Button>
          </Tooltip>
        )}
        <Tooltip label={variable.references.length ? t('variables.actions.copyResolved') : t('variables.actions.copy')}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('variables.actions.copyKey', { key: variable.key })}
            onClick={() => copy(variable.references.length ? variable.resolved : variable.value, variable.key)}
          >
            <Copy />
          </Button>
        </Tooltip>
        <Tooltip label={t('variables.actions.edit')}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={t('variables.actions.editKey', { key: variable.key })}
          >
            <Pencil />
          </Button>
        </Tooltip>
        <Tooltip label={t('variables.actions.delete')}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hover:bg-danger-soft hover:text-danger"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            aria-label={t('variables.actions.deleteKey', { key: variable.key })}
          >
            <Trash2 />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}

function EditRow({
  entity,
  catalog,
  variable,
  current,
  onDone,
}: {
  entity: Props['entity']
  catalog: CatalogEntity[]
  variable?: VariableRow
  /** Current key/value pairs, so a multi-line paste merges instead of replacing. */
  current: { key: string; value: string }[]
  onDone: () => void
}) {
  const { t } = useTranslation()
  const existingKeys = current.map((entry) => entry.key)
  const [key, setKey] = useState(variable?.key ?? '')
  const [value, setValue] = useState(variable?.value ?? '')
  const [keyError, setKeyError] = useState<string>()
  const invalidate = useInvalidateProject(entity.projectId)
  const save = useServerFn(saveVariable)
  const replace = useServerFn(replaceVariables)

  const mutation = useMutation({
    mutationFn: () => save({ data: { entityId: entity.id, variableId: variable?.id, key: key.trim(), value } }),
    onSuccess: async () => {
      await invalidate()
      toast.success(t(variable ? 'variables.saved' : 'variables.added', { key: key.trim() }))
      onDone()
    },
    onError: (error) => toast.error(errorMessage(error, t('common.genericError'))),
  })

  const submit = () => {
    const trimmed = key.trim()
    if (!trimmed) return setKeyError(t('variables.validation.required'))
    if (!isValidVariableKey(trimmed)) return setKeyError(t('variables.validation.pattern'))
    if (trimmed !== variable?.key && existingKeys.includes(trimmed))
      return setKeyError(t('variables.validation.exists', { key: trimmed }))
    setKeyError(undefined)
    mutation.mutate()
  }

  /** Pasting `KEY=value` fills both fields; pasting several lines imports them all. */
  const onPasteKey = async (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text')
    if (!text.includes('=')) return
    const { entries, errors } = parseEnv(text)
    if (entries.length === 0) return
    e.preventDefault()
    if (entries.length === 1 && !variable) {
      setKey(entries[0]!.key)
      setValue(entries[0]!.value)
      return
    }
    if (variable) return
    try {
      const summary = await replace({ data: { entityId: entity.id, entries: mergeEntries(current, entries) } })
      await invalidate()
      toast.success(
        t('variables.imported', { added: summary.added, updated: summary.updated }) +
          (errors.length ? ` · ${t('variables.ignoredLines', { count: errors.length })}` : ''),
      )
      onDone()
    } catch (error) {
      toast.error(errorMessage(error, t('common.genericError')))
    }
  }

  return (
    <form
      role="row"
      className="grid gap-2 border-b border-line bg-envelope-soft px-4 py-3 @3xl:grid-cols-[minmax(180px,0.8fr)_minmax(0,2fr)_278px] @3xl:items-start @3xl:gap-x-0 md:px-8"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div role="cell" className="grid gap-1 @3xl:pr-3">
        <Input
          autoFocus={!variable}
          value={key}
          onChange={(e) => {
            setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))
            setKeyError(undefined)
          }}
          onPaste={onPasteKey}
          onKeyDown={(e) => e.key === 'Escape' && onDone()}
          placeholder={t('variables.keyPlaceholder')}
          aria-label={t('variables.columns.key')}
          aria-invalid={!!keyError}
          spellCheck={false}
          className="font-mono font-bold"
        />
        <FieldError>{keyError}</FieldError>
      </div>
      <div role="cell" className="min-w-0 @3xl:pl-3">
        <ValueEditor
          id={`value-${variable?.id ?? 'new'}`}
          value={value}
          onChange={setValue}
          onSubmit={submit}
          onCancel={onDone}
          catalog={catalog}
          exclude={variable ? `${entity.name}.${variable.key}` : undefined}
        />
        <p className="mt-1.5 font-mono text-[11px] text-muted">
          {t('variables.editorHint')}
        </p>
      </div>
      <div role="cell" className="flex items-center justify-end gap-2 @3xl:pl-3">
        <Button type="button" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={mutation.isPending}>
          {variable ? t('common.save') : t('variables.addShort')}
        </Button>
      </div>
    </form>
  )
}

function BrokenStamp() {
  const { t } = useTranslation()
  return (
    <span className="inline-block -rotate-2 border-[1.5px] border-danger px-1.5 py-px font-mono text-[11px] leading-[16px] font-bold tracking-[0.08em] whitespace-nowrap text-danger uppercase">
      {t('variables.brokenStamp')}
    </span>
  )
}

function mergeEntries(current: { key: string; value: string }[], incoming: { key: string; value: string }[]) {
  const byKey = new Map(current.map((entry) => [entry.key, entry.value]))
  for (const entry of incoming) byKey.set(entry.key, entry.value)
  return [...byKey].map(([key, value]) => ({ key, value }))
}

function EmptyVariables({ entityName, onAdd }: { entityName: string; onAdd: () => void }) {
  const { t } = useTranslation()
  const referenceExample = useReferenceExample()
  return (
    <div className="max-w-2xl px-4 py-10 md:px-8">
      <h2 className="text-[15px] font-semibold text-ink">{t('variables.empty.title', { name: entityName })}</h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
        <Trans
          i18nKey="variables.empty.body"
          values={{ syntax: referenceExample }}
          components={{ b: <b className="font-semibold text-ink" />, code: <code className="font-mono text-ink" /> }}
        />
      </p>
      <Button variant="primary" className="mt-5" onClick={onAdd}>
        <Plus />
        {t('variables.add')}
      </Button>
    </div>
  )
}
