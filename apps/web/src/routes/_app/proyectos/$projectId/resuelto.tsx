import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { serializeEnv } from '@vm/core'
import { Copy, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ResolvedTable } from '@/components/resolved-table'
import { TintSwatch } from '@/components/tint'
import { Button } from '@/components/ui/button'
import { headT } from '@/i18n/head'
import { useCopy } from '@/lib/clipboard'
import { useReferenceExample } from '@/lib/describe-errors'
import { resolvedProjectQuery } from '@/lib/queries'

export const Route = createFileRoute('/_app/proyectos/$projectId/resuelto')({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(resolvedProjectQuery(params.projectId))
    return { name: data.project.name }
  },
  head: ({ loaderData, match }) => ({
    meta: [{ title: `${headT(match.context)('resolved.title')} · ${loaderData?.name ?? ''} · Variables` }],
  }),
  component: ResolvedProjectPage,
})

function ResolvedProjectPage() {
  const { t } = useTranslation()
  const copy = useCopy()
  const referenceExample = useReferenceExample()
  const { projectId } = Route.useParams()
  const { data } = useSuspenseQuery(resolvedProjectQuery(projectId))
  const [revealAll, setRevealAll] = useState(false)

  const catalog = data.entities.map((e) => ({
    id: e.id,
    name: e.name,
    tint: e.tint,
    keys: e.variables.map((v) => v.key),
  }))
  const broken = data.entities.flatMap((e) => e.variables.filter((v) => v.errors.length).map((v) => ({ entity: e, key: v.key })))

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4 px-4 pt-6 pb-5 md:px-8 md:pt-7">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-tint">{t('resolved.title')}</h1>
          <p className="mt-1.5 max-w-[65ch] text-[13.5px] text-muted">
            <Trans
              i18nKey="resolved.intro"
              values={{ name: data.project.name, example: referenceExample }}
              components={{ b: <b className="font-semibold text-ink" />, code: <code className="font-mono text-ink" /> }}
            />
          </p>
          {broken.length > 0 && (
            <p className="mt-2 font-mono text-[11.5px] font-bold text-danger">
              {t('resolved.unresolved', { count: broken.length })}:{' '}
              {broken.map((b, i) => (
                <span key={`${b.entity.name}.${b.key}`}>
                  {i > 0 && ', '}
                  <Link
                    to="/proyectos/$projectId/$entityId"
                    params={{ projectId, entityId: b.entity.id }}
                    search={{ vista: 'variables', clave: b.key }}
                    className="underline decoration-danger/40"
                  >
                    {b.entity.name}.{b.key}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
        <Button onClick={() => setRevealAll((v) => !v)} aria-pressed={revealAll}>
          {revealAll ? <EyeOff /> : <Eye />}
          {revealAll ? t('values.hideAll') : t('values.showAll')}
        </Button>
      </header>

      {data.entities.length === 0 && (
        <p className="border-t border-line px-4 py-6 text-[13px] text-muted md:px-8">{t('resolved.noEntities')}</p>
      )}

      {data.entities.map((entity) => (
        <section key={entity.id} aria-labelledby={`resolved-${entity.id}`} className="mb-6">
          <div className="sticky top-12 z-10 flex items-center justify-between gap-3 border-y border-line bg-panel px-4 py-2 md:top-0 md:px-8">
            <h2 id={`resolved-${entity.id}`}>
              <Link
                to="/proyectos/$projectId/$entityId"
                params={{ projectId, entityId: entity.id }}
                search={{ vista: 'resuelto' }}
                className="flex items-center gap-2 font-mono text-[14px] font-bold text-tint hover:underline"
              >
                <TintSwatch tint={entity.tint} className="size-4" />
                {entity.name}
              </Link>
            </h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                copy(
                  serializeEnv(entity.variables.map((v) => ({ key: v.key, value: v.value }))),
                  t('resolved.envOf', { name: entity.name }),
                )
              }
            >
              <Copy />
              {t('editor.copy', { label: '.env' })}
            </Button>
          </div>
          <ResolvedTable
            entity={{ projectId, name: entity.name, tint: entity.tint }}
            rows={entity.variables}
            catalog={catalog}
            revealAll={revealAll}
          />
        </section>
      ))}
    </>
  )
}
