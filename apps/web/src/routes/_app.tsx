import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { sessionQuery } from '@/lib/queries'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery())
    if (!session) throw redirect({ to: '/entrar' })
    return { user: session.user }
  },
  component: () => (
    <TooltipProvider>
      <Outlet />
    </TooltipProvider>
  ),
})
