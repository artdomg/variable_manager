import { useForm } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { FieldError, Input, Label } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'
import { sessionQuery } from '@/lib/queries'

// Validation messages are translation keys; <FieldError> translates them.
const schemas = {
  login: z.object({
    name: z.string(),
    email: z.email('auth.validation.email'),
    password: z.string().min(1, 'auth.validation.passwordRequired'),
  }),
  signup: z.object({
    name: z.string().trim().min(1, 'auth.validation.name'),
    email: z.email('auth.validation.email'),
    password: z.string().min(8, 'auth.validation.passwordLength'),
  }),
}

/** better-auth error codes we word ourselves; anything else falls back to a generic message. */
const authErrors = {
  INVALID_EMAIL_OR_PASSWORD: 'auth.errors.invalidCredentials',
  USER_ALREADY_EXISTS: 'auth.errors.userExists',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'auth.errors.userExists',
  PASSWORD_TOO_SHORT: 'auth.errors.passwordTooShort',
} as const

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const { t } = useTranslation()
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
        const code = result.error.code as keyof typeof authErrors | undefined
        setError(t(code && code in authErrors ? authErrors[code] : 'auth.errors.generic'))
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
        {signup ? t('auth.signup.title') : t('auth.login.title')}
      </h1>
      <p className="mt-1.5 text-[13.5px] text-muted">
        {signup ? t('auth.signup.haveAccount') : t('auth.login.noAccount')}{' '}
        <Link to={signup ? '/entrar' : '/registro'} className="font-medium text-tint underline">
          {signup ? t('auth.signup.toLogin') : t('auth.login.toSignup')}
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
                <Label htmlFor="name">{t('auth.fields.name')}</Label>
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
              <Label htmlFor="email">{t('auth.fields.email')}</Label>
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
              <Label htmlFor="password">{t('auth.fields.password')}</Label>
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
              {submitting ? t('auth.submitting') : signup ? t('auth.signup.submit') : t('auth.login.submit')}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </>
  )
}
