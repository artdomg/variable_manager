import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { entriesToJson, serializeEnv } from '@vm/core'
import { Tabs } from 'radix-ui'
import { ChevronDown, Copy, Eye, EyeOff, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { DeleteEntityDialog, EntityDialog } from '@/components/entity-dialogs'
import { ResolvedTable } from '@/components/resolved-table'
import { TextEditor } from '@/components/text-editor'
import { TintSwatch } from '@/components/tint'
import { Button } from '@/components/ui/button'
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/dropdown'
import { VariablesTable } from '@/components/variables-table'
import { copyText } from '@/lib/clipboard'
import { fromNow, plural } from '@/lib/format'
import { entityQuery, projectQuery } from '@/lib/queries'
import { cn, errorMessage } from '@/lib/utils'

const views = ['variables', 'raw', 'json', 'resuelto'] as const
type View = (typeof views)[number]

export const Route = createFileRoute('/_app/proyectos/$projectId/$entityId')({
  validateSearch: z.object({
    vista: z.enum(views).catch('variables'),
    clave: z.string().optional(),
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(entityQuery(params.entityId))
    const project = await context.queryClient.ensureQueryData(projectQuery(params.projectId))
    return { title: `${data.entity.name} · ${project.name}` }
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.title ?? 'Entidad'} · Variables` }] }),
  component: EntityPage,
  errorComponent: ({ error }) => (
    <div className="px-4 py-16 md:px-8">
      <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-ink">No encontramos esta entidad</h1>
      <p className="mt-2 text-[13.5px] text-muted">{errorMessage(error)}.</p>
    </div>
  ),
})

function EntityPage() {
  const { entityId } = Route.useParams()
  // Remount per entity so reveal and edit state never leak between entities.
  return <EntityView key={entityId} />
}

const tabs: { value: View; label: string }[] = [
  { value: 'variables', label: 'Variables' },
  { value: 'raw', label: 'Raw' },
  { value: 'json', label: 'JSON' },
  { value: 'resuelto', label: 'Resuelto' },
]

function EntityView() {
  const { entityId, projectId } = Route.useParams()
  const { vista, clave } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data } = useSuspenseQuery(entityQuery(entityId))
  const { entity, variables, catalog, dependants } = data

  const [revealAll, setRevealAll] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editingEntity, setEditingEntity] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const entries = variables.map((v) => ({ key: v.key, value: v.value }))
  const resolvedEntries = variables.map((v) => ({ key: v.key, value: v.resolved }))
  const referenceCount = variables.reduce((n, v) => n + v.references.length, 0)
  const broken = variables.filter((v) => v.errors.length > 0)

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 px-4 pt-6 pb-5 md:px-8 md:pt-7">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <TintSwatch tint={entity.tint} className="size-7" />
            <h1 className="truncate font-mono text-[24px] leading-none font-bold tracking-[-0.02em] text-tint">
              {entity.name}
            </h1>
          </div>
          {entity.description && <p className="mt-2 max-w-[65ch] text-[13.5px] text-muted">{entity.description}</p>}
          <p className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 font-mono text-[11.5px] text-muted">
            <span>{plural(variables.length, 'variable', 'variables')}</span>
            <span>{plural(referenceCount, 'referencia', 'referencias')}</span>
            {broken.length > 0 && (
              <Link
                to="."
                search={{ vista: 'variables', clave: broken[0]!.key }}
                className="font-bold text-danger underline decoration-danger/40"
              >
                {plural(broken.length, 'ref. rota', 'refs. rotas')}
              </Link>
            )}
            {dependants.length > 0 && <span>usada por {plural(dependants.length, 'variable', 'variables')}</span>}
            <span>actualizada {fromNow(entity.updatedAt)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setRevealAll((v) => !v)} aria-pressed={revealAll}>
            {revealAll ? <EyeOff /> : <Eye />}
            {revealAll ? 'Ocultar valores' : 'Mostrar valores'}
          </Button>
          <Menu>
            <MenuTrigger asChild>
              <Button>
                <Copy />
                Copiar
                <ChevronDown className="-mr-1 text-muted" />
              </Button>
            </MenuTrigger>
            <MenuContent className="w-56">
              <MenuItem onSelect={() => copyText(serializeEnv(resolvedEntries), '.env resuelto')}>
                .env resuelto
              </MenuItem>
              <MenuItem onSelect={() => copyText(serializeEnv(entries), '.env')}>.env con referencias</MenuItem>
              <MenuItem onSelect={() => copyText(entriesToJson(resolvedEntries), 'JSON resuelto')}>
                JSON resuelto
              </MenuItem>
            </MenuContent>
          </Menu>
          <Button
            variant="primary"
            aria-label="Nueva variable"
            onClick={() => {
              setEditing('new')
              if (vista !== 'variables') void navigate({ search: { vista: 'variables' } })
            }}
          >
            <Plus />
            <span className="hidden sm:inline">Nueva variable</span>
          </Button>
          <Menu>
            <MenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Más acciones de la entidad">
                <MoreHorizontal />
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem onSelect={() => setEditingEntity(true)}>
                <Pencil />
                Editar entidad
              </MenuItem>
              <MenuSeparator />
              <MenuItem tone="danger" onSelect={() => setDeleting(true)}>
                <Trash2 />
                Eliminar entidad
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </header>

      <Tabs.Root
        value={vista}
        onValueChange={(value) => void navigate({ search: { vista: value as View }, replace: true })}
      >
        <Tabs.List
          aria-label="Formato"
          className="sticky top-12 z-10 flex gap-6 overflow-x-auto border-b border-line bg-ground px-4 md:top-0 md:px-8"
        >
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'relative h-10 shrink-0 text-[13px] font-medium text-muted transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                'data-[state=active]:font-semibold data-[state=active]:text-tint data-[state=active]:shadow-[inset_0_-2px_0_var(--color-tint)]',
              )}
            >
              {tab.label}
              {tab.value === 'variables' && <span className="ml-1.5 font-mono text-[11px] font-normal">{variables.length}</span>}
              {tab.value === 'resuelto' && broken.length > 0 && (
                <span className="ml-1.5 font-mono text-[11px] font-bold text-danger">{broken.length}</span>
              )}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="variables" className="focus-visible:outline-none">
          <VariablesTable
            entity={entity}
            variables={variables}
            catalog={catalog}
            revealAll={revealAll}
            editing={editing}
            onEditingChange={setEditing}
            highlight={clave}
          />
        </Tabs.Content>
        <Tabs.Content value="raw" className="focus-visible:outline-none">
          <TextEditor format="raw" entity={entity} entries={entries} revealed={revealAll} onReveal={() => setRevealAll(true)} />
        </Tabs.Content>
        <Tabs.Content value="json" className="focus-visible:outline-none">
          <TextEditor format="json" entity={entity} entries={entries} revealed={revealAll} onReveal={() => setRevealAll(true)} />
        </Tabs.Content>
        <Tabs.Content value="resuelto" className="focus-visible:outline-none">
          {broken.length > 0 && (
            <p className="border-b border-line bg-danger-soft/70 px-4 py-2.5 text-[12.5px] text-danger md:px-8">
              {plural(broken.length, 'variable tiene', 'variables tienen')} referencias sin resolver; se copian con la
              referencia literal.
            </p>
          )}
          <ResolvedTable
            entity={{ ...entity, projectId }}
            rows={variables.map((v) => ({ key: v.key, value: v.resolved, references: v.references, errors: v.errors }))}
            catalog={catalog}
            revealAll={revealAll}
          />
        </Tabs.Content>
      </Tabs.Root>

      <EntityDialog projectId={projectId} entity={entity} open={editingEntity} onOpenChange={setEditingEntity} />
      <DeleteEntityDialog entity={entity} dependants={dependants} open={deleting} onOpenChange={setDeleting} />
    </>
  )
}
