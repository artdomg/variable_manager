import { createFileRoute, redirect } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { headT } from '@/i18n/head'
import { EntityDialog } from '@/components/entity-dialogs'
import { Button } from '@/components/ui/button'
import { projectQuery } from '@/lib/queries'

export const Route = createFileRoute('/_app/proyectos/$projectId/')({
  loader: async ({ context, params }) => {
    const project = await context.queryClient.ensureQueryData(projectQuery(params.projectId))
    const first = project.entities[0]
    if (first) {
      throw redirect({
        to: '/proyectos/$projectId/$entityId',
        params: { projectId: params.projectId, entityId: first.id },
        search: { vista: 'variables' },
        replace: true,
      })
    }
    return { name: project.name }
  },
  head: ({ loaderData, match }) => ({
    meta: [{ title: `${loaderData?.name ?? headT(match.context)('projects.label')} · Variables` }],
  }),
  component: EmptyProject,
})

function EmptyProject() {
  const { t } = useTranslation()
  const { projectId } = Route.useParams()
  const { name } = Route.useLoaderData()
  return (
    <div className="max-w-2xl px-4 pt-10 md:px-8">
      <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-tint">{name}</h1>
      <h2 className="mt-8 text-[15px] font-semibold text-ink">{t('entities.empty.title')}</h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{t('entities.empty.body')}</p>
      <pre className="mt-4 overflow-x-auto border-y border-line py-3 font-mono text-[12.5px] leading-relaxed text-ink">
        <span className="text-muted"># postgres</span>
        {`\nDATABASE_URL="postgres://app:${t('entities.empty.examplePassword')}@db.internal:5432/app"\n\n`}
        <span className="text-muted"># api</span>
        {'\nDATABASE_URL="${{postgres.DATABASE_URL}}"\nPORT="8080"'}
      </pre>
      <EntityDialog projectId={projectId}>
        <Button variant="primary" className="mt-6">
          <Plus />
          {t('entities.new')}
        </Button>
      </EntityDialog>
    </div>
  )
}
