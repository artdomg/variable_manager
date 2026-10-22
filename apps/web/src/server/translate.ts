import { getI18n } from '@/i18n'
import { detectLocale } from '@/i18n/locale'

/**
 * Translator for the current request's language, for errors thrown by server
 * functions. Isomorphic (not `.server.ts`) because module-level validators that
 * use it are also part of the client bundle.
 */
export const serverT = () => getI18n(detectLocale()).t
