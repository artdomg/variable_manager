import { useRouteContext, useRouter } from '@tanstack/react-router'
import type { Locale } from '.'
import { persistLocale } from './locale'

/** Current locale and a setter; the root beforeLoad re-reads the cookie on invalidate. */
export function useLocale() {
  const router = useRouter()
  const { locale } = useRouteContext({ from: '__root__' })
  const setLocale = async (next: Locale) => {
    if (next === locale) return
    persistLocale(next)
    await router.invalidate()
  }
  return { locale, setLocale }
}
