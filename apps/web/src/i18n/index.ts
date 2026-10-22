import { createInstance, type i18n } from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'

export const LOCALES = ['es', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'es'
export const LOCALE_COOKIE = 'vm-lang'

export const LOCALE_NAMES: Record<Locale, string> = { es: 'Español', en: 'English' }

export const resources = { es: { translation: es }, en: { translation: en } } as const

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** Cookie first, then the first supported language in Accept-Language, then Spanish. */
export function pickLocale(cookieHeader: string | null | undefined, acceptLanguage?: string | null): Locale {
  const fromCookie = cookieHeader?.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`))?.[1]
  if (isLocale(fromCookie)) return fromCookie
  for (const part of acceptLanguage?.split(',') ?? []) {
    const tag = part.split(';')[0]!.trim().slice(0, 2).toLowerCase()
    if (isLocale(tag)) return tag
  }
  return DEFAULT_LOCALE
}

/**
 * One instance per language that never switches language. Concurrent SSR
 * requests in different languages therefore cannot leak into each other;
 * changing language swaps instances instead of mutating one.
 */
const instances = new Map<Locale, i18n>()

export function getI18n(locale: Locale): i18n {
  let instance = instances.get(locale)
  if (!instance) {
    instance = createInstance()
    void instance.use(initReactI18next).init({
      lng: locale,
      fallbackLng: DEFAULT_LOCALE,
      resources,
      initAsync: false,
      interpolation: { escapeValue: false },
      returnNull: false,
    })
    instances.set(locale, instance)
  }
  return instance
}
