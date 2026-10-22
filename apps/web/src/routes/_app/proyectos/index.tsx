import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { AppShell, RailLabel, railItemClass } from '@/components/app-shell'
import { ProjectDialog } from '@/components/project-dialogs'
import { TintSwatch } from '@/components/tint'
import { Button } from '@/components/ui/button'
import { fromNow, plural } from '@/lib/format'
import { projectsQuery } from '@/lib/queries'

export const Route = createFileRoute('/_app/proyectos/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery()),
  head: () => ({ meta: [{ title: 'Proyectos · Variables' }] }),
  component: ProjectsPage,
})

function ProjectsPage() {
  const { data: projects } = useSuspenseQuery(projectsQuery())

  const rail = (
    <>
      <RailLabel aside={<span>{projects.length}</span>}>Proyectos</RailLabel>
      {projects.map((p) => (
        <Link key={p.id} to="/proyectos/$projectId" params={{ projectId: p.id }} className={railItemClass(false)}>
          <span className="truncate">{p.name}</span>
        </Link>
      ))}
    </>
  )

  return (
    <AppShell rail={rail}>
      <header className="flex flex-wrap items-end justify-between gap-4 px-4 pt-7 pb-5 md:px-8">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-tint">Proyectos</h1>
          <p className="mt-1 font-mono text-[11.5px] text-muted">
            {plural(projects.length, 'proyecto', 'proyectos')} ·{' '}
            {plural(
              projects.reduce((n, p) => n + p.variableCount, 0),
              'variable cifrada',
              'variables cifradas',
            )}
          </p>
        </div>
        <ProjectDialog>
          <Button variant="primary">
            <Plus />
            Nuevo proyecto
          </Button>
        </ProjectDialog>
      </header>

      {projects.length === 0 ? (
        <EmptyProjects />
      ) : (
        <ul className="border-t border-line">
          {projects.map((p) => (
            <li key={p.id} className="border-b border-line">
              <Link
                to="/proyectos/$projectId"
                params={{ projectId: p.id }}
                className="grid gap-x-6 gap-y-2 px-4 py-4 transition-colors duration-150 hover:bg-envelope-soft focus-visible:bg-envelope-soft focus-visible:outline-none @3xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] @3xl:items-center md:px-8"
              >
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-ink">{p.name}</div>
                  {p.description && <div className="mt-0.5 truncate text-[13px] text-muted">{p.description}</div>}
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[12px] text-ink">
                  {p.entities.length === 0 ? (
                    <span className="font-sans text-muted">Sin entidades</span>
                  ) : (
                    p.entities.map((e) => (
                      <span key={e.name} className="inline-flex items-center gap-1.5">
                        <TintSwatch tint={e.tint} />
                        {e.name}
                      </span>
                    ))
                  )}
                </div>
                <div className="font-mono text-[11.5px] whitespace-nowrap text-muted @3xl:text-right">
                  {plural(p.variableCount, 'variable', 'variables')} · {fromNow(p.updatedAt)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}

function EmptyProjects() {
  return (
    <div className="mx-4 max-w-xl border-t border-line pt-8 md:mx-8">
      <h2 className="text-[15px] font-semibold text-ink">Empieza con un proyecto</h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
        Un proyecto contiene entidades —una API, una web, una base de datos— y cada entidad sus variables en formato{' '}
        <code className="font-mono text-ink">CLAVE="valor"</code>. Una entidad puede usar el valor de otra con{' '}
        <code className="font-mono text-ink">{'${{postgres.DATABASE_URL}}'}</code>.
      </p>
      <ProjectDialog>
        <Button variant="primary" className="mt-5">
          <Plus />
          Crear el primer proyecto
        </Button>
      </ProjectDialog>
    </div>
  )
}
