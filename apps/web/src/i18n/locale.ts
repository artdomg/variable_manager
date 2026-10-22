import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { LOCALE_COOKIE, pickLocale, type Locale } from '.'

/** The active locale, read from the request on the server and from document.cookie in the browser. */
export const detectLocale = createIsomorphicFn()
  .server((): Locale => {
    const headers = getRequest().headers
    return pickLocale(headers.get('cookie'), headers.get('accept-language'))
  })
  .client((): Locale => pickLocale(document.cookie, navigator.languages.join(',')))

export function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}
