import { createFileRoute } from '@tanstack/react-router'
import { AuthForm } from '@/components/auth-form'
import { headT } from '@/i18n/head'

export const Route = createFileRoute('/_auth/registro')({
  head: ({ match }) => ({ meta: [{ title: `${headT(match.context)('auth.meta.signup')} · Variables` }] }),
  component: () => <AuthForm mode="signup" />,
})
