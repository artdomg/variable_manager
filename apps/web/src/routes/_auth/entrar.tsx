import { createFileRoute } from '@tanstack/react-router'
import { AuthForm } from '@/components/auth-form'
import { headT } from '@/i18n/head'

export const Route = createFileRoute('/_auth/entrar')({
  head: ({ match }) => ({ meta: [{ title: `${headT(match.context)('auth.meta.login')} · Variables` }] }),
  component: () => <AuthForm mode="login" />,
})
