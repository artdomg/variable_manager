import { useForm } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { FieldError, Input, Label } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'
import { sessionQuery } from '@/lib/queries'

const schemas = {
  login: z.object({
    name: z.string(),
    email: z.email('Escribe un correo válido'),
    password: z.string().min(1, 'Escribe tu contraseña'),
  }),
  signup: z.object({
    name: z.string().trim().min(1, 'Escribe tu nombre'),
    email: z.email('Escribe un correo válido'),
    password: z.string().min(8, 'Usa al menos 8 caracteres'),
  }),
}

const authErrors: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Correo o contraseña incorrectos.',
  USER_ALREADY_EXISTS: 'Ya existe una cuenta con ese correo. Entra en su lugar.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Ya existe una cuenta con ese correo. Entra en su lugar.',
  PASSWORD_TOO_SHORT: 'La contraseña es demasiado corta.',
}

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>()
  const signup = mode === 'signup'

  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    validators: { onSubmit: schemas[mode] },
    onSubmit: async ({ value }) => {
      setError(undefined)
      const result = signup
        ? await authClient.signUp.email({ name: value.name.trim(), email: value.email, password: value.password })
        : await authClient.signIn.email({ email: value.email, password: value.password })
      if (result.error) {
        setError(authErrors[result.error.code ?? ''] ?? result.error.message ?? 'No se pudo continuar.')
        return
      }
      // The session query has no observers, so invalidating alone would not refetch it.
      await queryClient.fetchQuery({ ...sessionQuery(), staleTime: 0 })
      await navigate({ to: '/proyectos' })
    },
  })

  return (
    <>
      <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-ink">
        {signup ? 'Crea tu cuenta' : 'Entra a tus variables'}
      </h1>
      <p className="mt-1.5 text-[13.5px] text-muted">
        {signup ? '¿Ya tienes cuenta? ' : '¿Aún no tienes cuenta? '}
        <Link to={signup ? '/entrar' : '/registro'} className="font-medium text-tint underline">
          {signup ? 'Entra' : 'Regístrate'}
        </Link>
      </p>

      <form
        className="mt-8 grid gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
      >
        {signup && (
          <form.Field name="name">
            {(field) => (
              <div className="grid gap-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  className="h-9"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
              </div>
            )}
          </form.Field>
        )}
        <form.Field name="email">
          {(field) => (
            <div className="grid gap-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="h-9"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
            </div>
          )}
        </form.Field>
        <form.Field name="password">
          {(field) => (
            <div className="grid gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete={signup ? 'new-password' : 'current-password'}
                className="h-9"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
            </div>
          )}
        </form.Field>

        {error && (
          <p role="alert" className="border border-danger/40 bg-danger-soft px-3 py-2 text-[13px] text-danger">
            {error}
          </p>
        )}

        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(submitting) => (
            <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" disabled={submitting}>
              {submitting ? 'Un momento…' : signup ? 'Crear cuenta' : 'Entrar'}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </>
  )
}
