import { getI18n, type Locale } from '.'

/** Translator for route `head()` callbacks, which run outside React. */
export const headT = (context: { locale: Locale }) => getI18n(context.locale).t
