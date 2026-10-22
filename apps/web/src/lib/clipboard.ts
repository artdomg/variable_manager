import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

/** Copies text and confirms with a toast naming what was copied. */
export function useCopy() {
  const { t } = useTranslation()
  return async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('common.copied', { label }))
    } catch {
      toast.error(t('common.copyFailed'))
    }
  }
}
