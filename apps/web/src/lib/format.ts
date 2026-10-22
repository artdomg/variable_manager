import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/es'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useTranslation } from 'react-i18next'

dayjs.extend(relativeTime)

/**
 * Date formatting in the active language. The locale is applied per call, not
 * globally, so concurrent SSR requests in different languages stay correct.
 */
export function useFormat() {
  const { i18n } = useTranslation()
  const locale = i18n.language
  return {
    fromNow: (date: Date | string | number) => dayjs(date).locale(locale).fromNow(),
  }
}
