import { createFileRoute, redirect } from '@tanstack/react-router'
import { sessionQuery } from '@/lib/queries'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery())
    throw redirect({ to: session ? '/proyectos' : '/entrar' })
  },
})
