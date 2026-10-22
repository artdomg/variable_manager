import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, Outlet, createFileRoute, useParams } from '@tanstack/react-router'
import { Check, ChevronsUpDown, FileCheck2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppShell, RailLabel, railItemClass } from '@/components/app-shell'
import { EntityDialog } from '@/components/entity-dialogs'
import { DeleteProjectDialog, ProjectDialog } from '@/components/project-dialogs'
import { TintSwatch } from '@/components/tint'
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/dropdown'
import { projectQuery, projectsQuery } from '@/lib/queries'
import { cn, errorMessage } from '@/lib/utils'

export const Route = createFileRoute('/_app/proyectos/$projectId')({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(projectQuery(params.projectId)),
      context.queryClient.ensureQueryData(projectsQuery()),
    ])
  },
  component: ProjectLayout,
  errorComponent: ProjectError,
})

function ProjectLayout() {
  const { t } = useTranslation()
  const { projectId } = Route.useParams()
  const { data: project } = useSuspenseQuery(projectQuery(projectId))
  const entityId = useParams({ strict: false, select: (p) => p.entityId })

  const rail = (
    <>
      <ProjectSwitcher project={project} />
      <RailLabel aside={<span>{project.entities.length}</span>}>{t('entities.title')}</RailLabel>
      {project.entities.map((e) => (
        <Link
          key={e.id}
          to="/proyectos/$projectId/$entityId"
          params={{ projectId, entityId: e.id }}
          search={{ vista: 'variables' }}
          className={railItemClass(e.id === entityId)}
        >
          <TintSwatch tint={e.tint} className="size-[18px] border-current/30" />
          <span className="min-w-0 flex-1 truncate">{e.name}</span>
          <span className="text-[11px] font-normal opacity-75">{e.variableCount}</span>
        </Link>
      ))}
      <EntityDialog projectId={projectId}>
        <button className="mt-1 flex h-9 w-full items-center gap-3 px-5 text-[13px] text-rail-muted transition-colors hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white">
          <Plus className="size-[18px]" />
          {t('entities.new')}
        </button>
      </EntityDialog>

      <div className="mt-6">
        <RailLabel>{t('nav.views')}</RailLabel>
        <Link
          to="/proyectos/$projectId/resuelto"
          params={{ projectId }}
          className={railItemClass(false)}
          activeProps={{ className: railItemClass(true) }}
        >
          <FileCheck2 className="size-[18px]" />
          <span className="font-sans">{t('resolved.title')}</span>
        </Link>
      </div>
    </>
  )

  return (
    <AppShell rail={rail}>
      <Outlet />
    </AppShell>
  )
}

function ProjectSwitcher({ project }: { project: { id: string; name: string; description: string } }) {
  const { t } = useTranslation()
  const { data: projects } = useSuspenseQuery(projectsQuery())
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <div className="mb-5 px-3">
      <Menu>
        <MenuTrigger className="flex h-10 w-full items-center gap-2 border border-white/18 px-2.5 text-left text-white transition-colors hover:border-white/35 focus-visible:outline-2 focus-visible:outline-white data-[state=open]:border-white/45">
          <span className="min-w-0 flex-1">
            <span className="block font-mono text-[10.5px] tracking-[0.08em] text-rail-muted uppercase">{t('projects.label')}</span>
            <span className="block truncate text-[13px] leading-tight font-semibold">{project.name}</span>
          </span>
          <ChevronsUpDown className="size-4 text-rail-muted" />
        </MenuTrigger>
        <MenuContent align="start" className="w-[224px]">
          {projects.map((p) => (
            <MenuItem key={p.id} asChild>
              <Link to="/proyectos/$projectId" params={{ projectId: p.id }}>
                <Check className={cn(p.id !== project.id && 'invisible')} />
                <span className="truncate">{p.name}</span>
              </Link>
            </MenuItem>
          ))}
          <MenuSeparator />
          <MenuItem asChild>
            <Link to="/proyectos">{t('projects.all')}</Link>
          </MenuItem>
          <MenuItem onSelect={() => setEditing(true)}>
            <Pencil />
            {t('projects.edit')}
          </MenuItem>
          <MenuItem tone="danger" onSelect={() => setDeleting(true)}>
            <Trash2 />
            {t('projects.delete')}
          </MenuItem>
        </MenuContent>
      </Menu>
      <ProjectDialog project={project} open={editing} onOpenChange={setEditing} />
      <DeleteProjectDialog project={project} open={deleting} onOpenChange={setDeleting} />
    </div>
  )
}

function ProjectError({ error }: { error: unknown }) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-md px-4 py-24">
      <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-ink">{t('projects.notFound.title')}</h1>
      <p className="mt-2 text-[13.5px] text-muted">{t('projects.notFound.body', { detail: errorMessage(error, t('common.genericError')) })}</p>
      <Link to="/proyectos" className="mt-5 inline-block font-medium text-tint underline">
        {t('projects.back')}
      </Link>
    </div>
  )
}
