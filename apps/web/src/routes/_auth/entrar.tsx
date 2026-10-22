import { createFileRoute } from '@tanstack/react-router'
import { AuthForm } from '@/components/auth-form'

export const Route = createFileRoute('/_auth/entrar')({
  head: () => ({ meta: [{ title: 'Entrar · Variables' }] }),
  component: () => <AuthForm mode="login" />,
})
