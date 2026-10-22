import { useMutation } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { entriesToJson, parseEnv, parseJsonEnv, serializeEnv, type EnvEntry } from '@vm/core'
import { Copy, Eye } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { TintStrip } from '@/components/tint'
import { useCopy } from '@/lib/clipboard'
import { useDescribeParseError } from '@/lib/describe-errors'
import { useInvalidateProject } from '@/lib/invalidate'
import { cn, errorMessage } from '@/lib/utils'
import { replaceVariables } from '@/server/projects'

const formats = {
  raw: { serialize: serializeEnv, parse: parseEnv, label: '.env' },
  json: { serialize: entriesToJson, parse: parseJsonEnv, label: 'JSON' },
} as const

/**
 * Edits the whole entity as `.env` text or JSON. The text stays under the
 * entity's tint until revealed; saving replaces the full set of variables.
 */
export function TextEditor({
  format,
  entity,
  entries,
  revealed,
  onReveal,
}: {
  format: keyof typeof formats
  entity: { id: string; projectId: string; name: string; tint: number }
  entries: EnvEntry[]
  revealed: boolean
  onReveal: () => void
}) {
  const { t } = useTranslation()
  const copy = useCopy()
  const describe = useDescribeParseError()
  const { serialize, parse, label } = formats[format]
  const saved = useMemo(() => serialize(entries), [serialize, entries])
  const [text, setText] = useState(saved)
  const [baseline, setBaseline] = useState(saved)
  const textarea = useRef<HTMLTextAreaElement>(null)

  // Grow with the content instead of scrolling, so the line-number gutter
  // always lines up with the text. The offset term keeps room for the
  // horizontal scrollbar that long lines produce.
  useLayoutEffect(() => {
    const el = textarea.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`
  }, [text])

  // Adopt fresh server data unless the user has unsaved edits.
  useEffect(() => {
    setText((current) => (current === baseline ? saved : current))
    setBaseline(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved])

  const parsed = useMemo(() => parse(text), [parse, text])
  const diff = useMemo(() => {
    const before = new Map(entries.map((e) => [e.key, e.value]))
    const after = new Map(parsed.entries.map((e) => [e.key, e.value]))
    let added = 0
    let updated = 0
    for (const [key, value] of after) {
      if (!before.has(key)) added++
      else if (before.get(key) !== value) updated++
    }
    const removed = [...before.keys()].filter((key) => !after.has(key))
    const reordered = parsed.entries.some((e, i) => entries[i]?.key !== e.key)
    return { added, updated, removed, reordered }
  }, [entries, parsed.entries])

  // Comments and formatting are not stored, so only a change in the variables counts.
  const dirty =
    text !== saved && (diff.added > 0 || diff.updated > 0 || diff.removed.length > 0 || diff.reordered || parsed.errors.length > 0)
  const shown = revealed || entries.length === 0

  const invalidate = useInvalidateProject(entity.projectId)
  const replace = useServerFn(replaceVariables)
  const mutation = useMutation({
    mutationFn: () => replace({ data: { entityId: entity.id, entries: parsed.entries } }),
    onSuccess: async (summary) => {
      setText(serialize(parsed.entries))
      await invalidate()
      toast.success(
        t('editor.saved', { added: summary.added, updated: summary.updated, removed: summary.removed }),
      )
    },
    onError: (error) => toast.error(errorMessage(error, t('common.genericError'))),
  })

  const canSave = dirty && parsed.errors.length === 0 && !mutation.isPending
  const lineCount = text.split('\n').length

  return (
    <div className="px-4 pt-3 pb-5 md:px-8">
      <div className="sticky top-22 z-[5] -mx-1 mb-1 flex flex-wrap items-center gap-x-4 gap-y-2 bg-ground px-1 py-2 md:top-10">
        <p className="font-mono text-[11.5px] text-muted">
          {t('editor.count', { count: parsed.entries.length })}
          {parsed.errors[0] && (
            <span className="text-danger">
              {' · '}
              {parsed.errors[0].line > 0 && `${t('editor.line', { line: parsed.errors[0].line })}: `}
              {describe(parsed.errors[0])}
            </span>
          )}
          {dirty && parsed.errors.length === 0 && (
            <>
              {` · ${t('editor.onSave')}: `}
              <span className="text-ok">+{diff.added}</span> · <span className="text-tint">~{diff.updated}</span> ·{' '}
              <span className={cn(diff.removed.length && 'font-bold text-danger')}>−{diff.removed.length}</span>
            </>
          )}
        </p>
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={() => copy(text, label)}>
            <Copy />
            {t('editor.copy', { label })}
          </Button>
          {dirty && (
            <Button size="sm" onClick={() => setText(saved)}>
              {t('editor.discard')}
            </Button>
          )}
          <Button size="sm" variant="primary" disabled={!canSave} onClick={() => mutation.mutate()}>
            {t('editor.save')}
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="flex overflow-hidden rounded-[5px] border border-line-strong bg-ground focus-within:border-accent focus-within:ring-3 focus-within:ring-focus/25">
          <div
            aria-hidden
            className="w-11 shrink-0 border-r border-line bg-panel py-3 pr-2.5 text-right font-mono text-[12.5px] leading-[20px] text-muted select-none"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} className={cn(parsed.errors.some((e) => e.line === i + 1) && 'font-bold text-danger')}>
                {i + 1}
              </div>
            ))}
          </div>
          <textarea
            ref={textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                if (canSave) mutation.mutate()
              }
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            wrap="off"
            aria-label={t('editor.ariaLabel', { name: entity.name, format: label })}
            readOnly={!shown}
            tabIndex={shown ? 0 : -1}
            placeholder={format === 'raw' ? t('editor.placeholderRaw') : t('editor.placeholderJson')}
            className={cn(
              'block min-h-64 w-full min-w-0 resize-none overflow-x-auto overflow-y-hidden bg-transparent px-3 py-3 font-mono text-[12.5px] leading-[20px] text-ink focus:outline-none',
              !shown && 'select-none',
            )}
          />
        </div>

        {!shown && (
          <div className="absolute inset-0 flex flex-col items-center rounded-[5px] border border-line-strong bg-ground">
            <div aria-hidden className="absolute inset-0 grid content-start gap-[8px] p-3 pl-14">
              {entries.map((entry) => (
                <div key={entry.key} className="flex items-center gap-2 font-mono text-[12.5px] leading-[12px]">
                  <span className="font-bold text-ink/80">{entry.key}=</span>
                  <TintStrip tint={entity.tint} length={entry.value.length} />
                </div>
              ))}
            </div>
            {/* Sticky so the prompt stays in view however long the entity is. */}
            <div className="sticky top-[30vh] mt-24 grid justify-items-center gap-2 bg-ground/92 px-6 py-4 shadow-[0_0_0_1px_var(--color-line),0_12px_32px_-12px_rgb(15_20_45/0.3)]">
              <p className="text-[13px] text-ink">{t('editor.coverNote')}</p>
              <Button variant="primary" onClick={onReveal}>
                <Eye />
                {t('editor.reveal')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {parsed.errors.length > 0 && (
        <ul className="mt-3 grid gap-1 text-[12.5px] text-danger" role="alert">
          {parsed.errors.slice(0, 6).map((error, i) => (
            <li key={i}>
              {error.line > 0 && <span className="font-mono font-bold">{t('editor.line', { line: error.line })}: </span>}
              {describe(error)}
            </li>
          ))}
        </ul>
      )}
      {dirty && diff.removed.length > 0 && parsed.errors.length === 0 && (
        <p className="mt-3 text-[12.5px] text-danger">
          {t('editor.willRemove')}: <span className="font-mono">{diff.removed.join(', ')}</span>
        </p>
      )}
    </div>
  )
}
