import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from './auth.server'
import { serverT } from './translate'

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) return null
  return { user: { id: session.user.id, name: session.user.name, email: session.user.email } }
})

/** Rejects anonymous calls and exposes the signed-in user to the handler. */
export const authMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) throw new Error(serverT()('errors.unauthorized'))
  return next({ context: { userId: session.user.id } })
})
