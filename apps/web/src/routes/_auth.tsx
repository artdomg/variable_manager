import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { TintStrip, TintSwatch } from '@/components/tint'
import { sessionQuery } from '@/lib/queries'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery())
    if (session) throw redirect({ to: '/proyectos' })
  },
  component: AuthLayout,
})

const specimen = [
  { key: 'DATABASE_URL', ref: 'postgres', tint: 2 },
  { key: 'JWT_SECRET', length: 28, tint: 0 },
  { key: 'REDIS_URL', ref: 'redis', tint: 3 },
  { key: 'STRIPE_SECRET_KEY', length: 34, tint: 0 },
]

function AuthLayout() {
  return (
    <div className="grid min-h-dvh md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-tint p-10 text-rail-ink md:flex [--tint-ink:var(--color-rail-ink)]">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-white">
          <TintSwatch tint={4} className="size-5 border-white/40" />
          Variables
        </div>
        <div className="max-w-md">
          <p className="text-[22px] leading-tight font-semibold tracking-[-0.015em] text-white">
            Tus variables de entorno, cifradas y conectadas entre sí.
          </p>
          <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-rail-muted">
            Define un valor una vez y refiérelo desde otras entidades con{' '}
            <code className="font-mono text-rail-ink">{'${{entidad.VARIABLE}}'}</code>.
          </p>
          <dl className="mt-8 border-t border-rail-line font-mono text-[12.5px]">
            {specimen.map((row) => (
              <div key={row.key} className="grid grid-cols-[11rem_minmax(0,1fr)] items-center gap-4 border-b border-rail-line py-2.5">
                <dt className="truncate font-bold text-white">{row.key}</dt>
                <dd className="flex min-w-0 items-center gap-2 overflow-hidden">
                  {row.ref ? (
                    <span className="inline-flex min-w-0 items-center gap-1.5 border border-white/25 px-1.5 py-0.5 text-rail-ink">
                      <TintSwatch tint={row.tint} className="size-3" />
                      <span className="truncate">
                        <b>{row.ref}</b>.{row.key}
                      </span>
                    </span>
                  ) : (
                    <TintStrip tint={row.tint} length={row.length ?? 20} className="max-w-full" />
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="font-mono text-[11px] text-rail-muted">Valores cifrados con AES-256-GCM</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-12 md:px-10">
        <div className="w-full max-w-[360px]">
          <div className="mb-10 flex items-center gap-2.5 text-[15px] font-bold text-tint md:hidden">
            <TintSwatch tint={4} className="size-5" />
            Variables
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
