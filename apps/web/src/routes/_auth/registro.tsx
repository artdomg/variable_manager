import { createFileRoute } from '@tanstack/react-router'
import { AuthForm } from '@/components/auth-form'

export const Route = createFileRoute('/_auth/registro')({
  head: () => ({ meta: [{ title: 'Crear cuenta · Variables' }] }),
  component: () => <AuthForm mode="signup" />,
})
