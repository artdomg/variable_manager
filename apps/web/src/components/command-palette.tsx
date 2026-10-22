import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Command } from 'cmdk'
import { Dialog as D } from 'radix-ui'
import { FolderOpen, Search } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { TintSwatch } from '@/components/tint'
import { searchIndexQuery } from '@/lib/queries'
import { cn } from '@/lib/utils'

const LIMITS = { variables: 30, entities: 8, projects: 5 }

/** Lower is better: prefix of the name, prefix of `entity.KEY`, then substring. */
function score(q: string, name: string, qualified: string) {
  const n = name.toLowerCase()
  const full = qualified.toLowerCase()
  if (n.startsWith(q)) return 0
  if (full.startsWith(q)) return 1
  if (n.includes(q)) return 2
  if (full.includes(q)) return 3
  return null
}

/** Bolds the first occurrence of the query inside `text`. */
function Highlight({ text, query }: { text: string; query: string }) {
  const at = query ? text.toLowerCase().indexOf(query) : -1
  if (at === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent font-bold text-tint underline decoration-tint/40 underline-offset-2">
        {text.slice(at, at + query.length)}
      </mark>
      {text.slice(at + query.length)}
    </>
  )
}

/**
 * ⌘K search over variable keys, entities and projects. Values are not part of
 * the index, so searching never exposes a secret.
 */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [input, setInput] = useState('')
  const navigate = useNavigate()
  const currentProjectId = useParams({ strict: false, select: (p) => p.projectId })
  const currentEntityId = useParams({ strict: false, select: (p) => p.entityId })
  const { data, isPending } = useQuery({ ...searchIndexQuery(), enabled: open })
  const q = input.trim().toLowerCase()

  const results = useMemo(() => {
    if (!data) return { variables: [], entities: [], projects: [] }
    const projectName = new Map(data.projects.map((p) => [p.id, p.name]))
    const entityById = new Map(data.entities.map((e) => [e.id, e]))
    // The entity and project you are in rank ahead of the others at equal match quality.
    const boost = (projectId: string, entityId?: string) =>
      entityId === currentEntityId ? 0 : projectId === currentProjectId ? 0.25 : 0.5
    const rank = <T,>(items: (T & { rank: number | null })[], limit: number) =>
      items
        .filter((item): item is T & { rank: number } => item.rank !== null)
        .sort((a, b) => a.rank - b.rank)
        .slice(0, limit)

    if (!q) {
      // No query: the current project's entities, then the other projects.
      return {
        variables: [],
        entities: data.entities
          .filter((e) => e.projectId === currentProjectId)
          .map((e) => ({ ...e, projectName: projectName.get(e.projectId) ?? '' })),
        projects: data.projects.filter((p) => p.id !== currentProjectId),
      }
    }

    return {
      variables: rank(
        data.variables.flatMap((v) => {
          const e = entityById.get(v.entityId)
          if (!e) return []
          const s = score(q, v.key, `${e.name}.${v.key}`)
          return [{ ...v, entity: e, projectName: projectName.get(e.projectId) ?? '', rank: s === null ? null : s + boost(e.projectId, e.id) }]
        }),
        LIMITS.variables,
      ),
      entities: rank(
        data.entities.map((e) => {
          const s = score(q, e.name, e.name)
          return { ...e, projectName: projectName.get(e.projectId) ?? '', rank: s === null ? null : s + boost(e.projectId) }
        }),
        LIMITS.entities,
      ),
      projects: rank(
        data.projects.map((p) => ({ ...p, rank: score(q, p.name, p.name) })),
        LIMITS.projects,
      ),
    }
  }, [data, q, currentProjectId, currentEntityId])

  const go = (to: () => Promise<void>) => {
    onOpenChange(false)
    void to()
  }
  const empty = !isPending && results.variables.length + results.entities.length + results.projects.length === 0

  return (
    <D.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setInput('')
      }}
    >
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 bg-shade/40 data-[state=open]:animate-[fade-in_120ms_ease-out]" />
        <D.Content
          aria-describedby={undefined}
          className="fixed top-[10vh] left-1/2 z-50 w-[calc(100vw-32px)] max-w-[580px] -translate-x-1/2 overflow-hidden rounded-[8px] border border-line bg-ground shadow-[0_24px_60px_-16px_rgb(15_20_45/0.45)] focus:outline-none data-[state=open]:animate-[dialog-in_160ms_cubic-bezier(0.16,1,0.3,1)]"
        >
          <D.Title className="sr-only">Buscar variables y entidades</D.Title>
          <Command shouldFilter={false} loop label="Buscar variables y entidades">
            <div className="flex items-center gap-2.5 border-b border-line px-4">
              <Search className="size-4 shrink-0 text-muted" />
              <Command.Input
                value={input}
                onValueChange={setInput}
                placeholder="Busca una variable, entidad o proyecto…"
                className="h-12 w-full bg-transparent text-[14px] text-ink placeholder:text-muted focus:outline-none"
              />
              <kbd className="shrink-0 rounded-[4px] border border-line-strong px-1.5 font-mono text-[11px] text-muted">esc</kbd>
            </div>

            <Command.List className="max-h-[min(60vh,480px)] overflow-y-auto overscroll-contain p-1.5">
              {isPending && <p className="px-3 py-6 text-center text-[13px] text-muted">Cargando índice…</p>}
              {empty && (
                <Command.Empty className="px-3 py-8 text-center text-[13px] text-muted">
                  {q ? (
                    <>
                      Nada coincide con <b className="font-mono font-semibold text-ink">{input.trim()}</b>. Prueba con
                      parte del nombre, o <span className="font-mono">entidad.VARIABLE</span>.
                    </>
                  ) : (
                    'Aún no hay nada que buscar. Crea un proyecto y sus entidades.'
                  )}
                </Command.Empty>
              )}

              {results.variables.length > 0 && (
                <Group heading="Variables">
                  {results.variables.map((v) => (
                    <Item
                      key={`${v.entityId}.${v.key}`}
                      value={`var:${v.entityId}:${v.key}`}
                      onSelect={() =>
                        go(() =>
                          navigate({
                            to: '/proyectos/$projectId/$entityId',
                            params: { projectId: v.entity.projectId, entityId: v.entityId },
                            search: { vista: 'variables', clave: v.key },
                          }),
                        )
                      }
                      meta={v.entity.projectId === currentProjectId ? undefined : v.projectName}
                    >
                      <TintSwatch tint={v.entity.tint} className="size-3.5" />
                      <span className="min-w-0 truncate font-mono text-[13px]">
                        <span className="text-muted">
                          <Highlight text={v.entity.name} query={q} />.
                        </span>
                        <span className="font-semibold">
                          <Highlight text={v.key} query={q} />
                        </span>
                      </span>
                    </Item>
                  ))}
                </Group>
              )}

              {results.entities.length > 0 && (
                <Group heading={q ? 'Entidades' : 'Entidades de este proyecto'}>
                  {results.entities.map((e) => (
                    <Item
                      key={e.id}
                      value={`entity:${e.id}`}
                      onSelect={() =>
                        go(() =>
                          navigate({
                            to: '/proyectos/$projectId/$entityId',
                            params: { projectId: e.projectId, entityId: e.id },
                            search: { vista: 'variables' },
                          }),
                        )
                      }
                      meta={e.projectId === currentProjectId ? undefined : e.projectName}
                    >
                      <TintSwatch tint={e.tint} className="size-3.5" />
                      <span className="min-w-0 truncate font-mono text-[13px] font-semibold">
                        <Highlight text={e.name} query={q} />
                      </span>
                    </Item>
                  ))}
                </Group>
              )}

              {results.projects.length > 0 && (
                <Group heading="Proyectos">
                  {results.projects.map((p) => (
                    <Item
                      key={p.id}
                      value={`project:${p.id}`}
                      onSelect={() => go(() => navigate({ to: '/proyectos/$projectId', params: { projectId: p.id } }))}
                    >
                      <FolderOpen className="size-3.5 text-muted" />
                      <span className="min-w-0 truncate text-[13px] font-medium">
                        <Highlight text={p.name} query={q} />
                      </span>
                    </Item>
                  ))}
                </Group>
              )}
            </Command.List>

            <div className="flex gap-4 border-t border-line bg-panel px-4 py-2 font-mono text-[11px] text-muted">
              <span>↑↓ navegar</span>
              <span>↵ abrir</span>
              <span className="ml-auto hidden sm:inline">Los valores no se buscan</span>
            </div>
          </Command>
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}

function Group({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="mb-1 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-muted [&_[cmdk-group-heading]]:uppercase"
    >
      {children}
    </Command.Group>
  )
}

function Item({
  value,
  onSelect,
  meta,
  children,
}: {
  value: string
  onSelect: () => void
  meta?: string
  children: ReactNode
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className={cn(
        'flex h-9 cursor-default items-center gap-2.5 rounded-[5px] px-2.5 text-ink select-none',
        'data-[selected=true]:bg-envelope data-[selected=true]:text-tint',
      )}
    >
      {children}
      {meta && <span className="ml-auto shrink-0 truncate pl-3 text-[12px] text-muted">{meta}</span>}
    </Command.Item>
  )
}
