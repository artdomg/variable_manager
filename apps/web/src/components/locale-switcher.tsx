import { Check, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/dropdown'
import { LOCALES, LOCALE_NAMES } from '@/i18n'
import { useLocale } from '@/i18n/use-locale'
import { cn } from '@/lib/utils'

export function LocaleSwitcher() {
  const { t } = useTranslation()
  const { locale, setLocale } = useLocale()
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t('locale.label')}>
          <Languages />
          {LOCALE_NAMES[locale]}
        </Button>
      </MenuTrigger>
      <MenuContent className="w-40">
        {LOCALES.map((option) => (
          <MenuItem key={option} onSelect={() => void setLocale(option)} lang={option}>
            <Check className={cn(option !== locale && 'invisible')} />
            {LOCALE_NAMES[option]}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}
