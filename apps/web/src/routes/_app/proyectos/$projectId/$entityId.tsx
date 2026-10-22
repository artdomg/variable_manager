import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { entriesToJson, serializeEnv } from '@vm/core'
import { Tabs } from 'radix-ui'
import { ChevronDown, Copy, Eye, EyeOff, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { DeleteEntityDialog, EntityDialog } from '@/components/entity-dialogs'
import { ResolvedTable } from '@/components/resolved-table'
import { TextEditor } from '@/components/text-editor'
import { TintSwatch } from '@/components/tint'
import { Button } from '@/components/ui/button'
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/dropdown'
import { VariablesTable } from '@/components/variables-table'
import { headT } from '@/i18n/head'
import { useCopy } from '@/lib/clipboard'
import { useFormat } from '@/lib/format'
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
  head: ({ loaderData, match }) => ({
    meta: [{ title: `${loaderData?.title ?? headT(match.context)('entities.entity')} · Variables` }],
  }),
  component: EntityPage,
  errorComponent: EntityError,
})

function EntityError({ error }: { error: unknown }) {
  const { t } = useTranslation()
  return (
    <div className="px-4 py-16 md:px-8">
      <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-ink">{t('entities.notFound')}</h1>
      <p className="mt-2 text-[13.5px] text-muted">{errorMessage(error, t('common.genericError'))}.</p>
    </div>
  )
}

function EntityPage() {
  const { entityId } = Route.useParams()
  // Remount per entity so reveal and edit state never leak between entities.
  return <EntityView key={entityId} />
}

const tabs = [
  { value: 'variables', label: 'tabs.variables' },
  { value: 'raw', label: 'tabs.raw' },
  { value: 'json', label: 'tabs.json' },
  { value: 'resuelto', label: 'tabs.resolved' },
] as const satisfies { value: View; label: string }[]

function EntityView() {
  const { t } = useTranslation()
  const copy = useCopy()
  const { fromNow } = useFormat()
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
            <span>{t('entities.readout.variables', { count: variables.length })}</span>
            <span>{t('entities.readout.references', { count: referenceCount })}</span>
            {broken.length > 0 && (
              <Link
                to="."
                search={{ vista: 'variables', clave: broken[0]!.key }}
                className="font-bold text-danger underline decoration-danger/40"
              >
                {t('entities.readout.broken', { count: broken.length })}
              </Link>
            )}
            {dependants.length > 0 && <span>{t('entities.readout.usedBy', { count: dependants.length })}</span>}
            <span>{t('entities.readout.updated', { when: fromNow(entity.updatedAt) })}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setRevealAll((v) => !v)} aria-pressed={revealAll}>
            {revealAll ? <EyeOff /> : <Eye />}
            {revealAll ? t('values.hideAll') : t('values.showAll')}
          </Button>
          <Menu>
            <MenuTrigger asChild>
              <Button>
                <Copy />
                {t('copyMenu.label')}
                <ChevronDown className="-mr-1 text-muted" />
              </Button>
            </MenuTrigger>
            <MenuContent className="w-56">
              <MenuItem onSelect={() => copy(serializeEnv(resolvedEntries), t('copyMenu.envResolved'))}>
                {t('copyMenu.envResolved')}
              </MenuItem>
              <MenuItem onSelect={() => copy(serializeEnv(entries), '.env')}>{t('copyMenu.envWithReferences')}</MenuItem>
              <MenuItem onSelect={() => copy(entriesToJson(resolvedEntries), t('copyMenu.jsonResolved'))}>
                {t('copyMenu.jsonResolved')}
              </MenuItem>
            </MenuContent>
          </Menu>
          <Button
            variant="primary"
            aria-label={t('variables.new')}
            onClick={() => {
              setEditing('new')
              if (vista !== 'variables') void navigate({ search: { vista: 'variables' } })
            }}
          >
            <Plus />
            <span className="hidden sm:inline">{t('variables.new')}</span>
          </Button>
          <Menu>
            <MenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t('entities.moreActions')}>
                <MoreHorizontal />
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem onSelect={() => setEditingEntity(true)}>
                <Pencil />
                {t('entities.edit')}
              </MenuItem>
              <MenuSeparator />
              <MenuItem tone="danger" onSelect={() => setDeleting(true)}>
                <Trash2 />
                {t('entities.delete')}
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
          aria-label={t('tabs.label')}
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
              {t(tab.label)}
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
              {t('resolved.brokenNote', { count: broken.length })}
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
