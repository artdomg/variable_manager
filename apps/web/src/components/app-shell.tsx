import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useRouteContext, useRouterState } from '@tanstack/react-router'
import { Dialog as D } from 'radix-ui'
import { Check, LogOut, Menu as MenuIcon, Search, X } from 'lucide-react'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CommandPalette } from '@/components/command-palette'
import { TintSwatch } from '@/components/tint'
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/components/ui/dropdown'
import { LOCALES, LOCALE_NAMES } from '@/i18n'
import { useLocale } from '@/i18n/use-locale'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const OpenSearch = createContext<() => void>(() => {})

/** Tint-ink rail on the left, paper on the right. The rail becomes a drawer on narrow screens. */
export function AppShell({ rail, children }: { rail: ReactNode; children: ReactNode }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearching((current) => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const openSearch = () => {
    setOpen(false)
    setSearching(true)
  }

  return (
    <OpenSearch.Provider value={openSearch}>
      <div className="min-h-dvh md:grid md:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh md:block">
          <Rail>{rail}</Rail>
        </aside>

        <D.Root open={open} onOpenChange={setOpen}>
          <header className="sticky top-0 z-30 flex h-12 items-center justify-between bg-tint px-4 text-white md:hidden [--tint-ink:var(--color-rail-ink)]">
            <Brand />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={openSearch}
                className="grid size-8 place-items-center rounded-[5px] hover:bg-white/10"
                aria-label={t('search.open')}
              >
                <Search className="size-[18px]" />
              </button>
              <D.Trigger className="grid size-8 place-items-center rounded-[5px] hover:bg-white/10" aria-label={t('nav.open')}>
                <MenuIcon className="size-5" />
              </D.Trigger>
            </div>
          </header>
          <D.Portal>
            <D.Overlay className="fixed inset-0 z-40 bg-shade/50 data-[state=open]:animate-[fade-in_150ms_ease-out] md:hidden" />
            <D.Content className="fixed inset-y-0 left-0 z-50 w-[min(300px,86vw)] focus:outline-none md:hidden">
              <D.Title className="sr-only">{t('nav.title')}</D.Title>
              <D.Description className="sr-only">{t('nav.description')}</D.Description>
              <Rail>{rail}</Rail>
              <D.Close className="absolute top-3.5 right-3 grid size-8 place-items-center rounded-[5px] text-rail-ink hover:bg-white/10" aria-label={t('common.close')}>
                <X className="size-4" />
              </D.Close>
            </D.Content>
          </D.Portal>
        </D.Root>

        <main className="@container min-w-0">{children}</main>
        <CommandPalette open={searching} onOpenChange={setSearching} />
      </div>
    </OpenSearch.Provider>
  )
}

function Brand() {
  return (
    <Link to="/proyectos" className="flex items-center gap-2.5 text-[15px] font-bold tracking-[-0.01em] text-white">
      <TintSwatch tint={4} className="size-5 border-white/40" />
      Variables
    </Link>
  )
}

function Rail({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-tint pt-4 pb-3 text-rail-ink [--tint-ink:var(--color-rail-ink)]">
      <div className="px-5 pb-4">
        <Brand />
      </div>
      <SearchTrigger />
      <nav className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgb(255_255_255/0.2)_transparent]">{children}</nav>
      <UserMenu />
    </div>
  )
}

function SearchTrigger() {
  const { t } = useTranslation()
  const openSearch = useContext(OpenSearch)
  const [shortcut, setShortcut] = useState('⌘K')
  useEffect(() => {
    if (!/Mac|iPhone|iPad/.test(navigator.userAgent)) setShortcut('Ctrl K')
  }, [])
  return (
    <div className="px-3 pb-3">
      <button
        type="button"
        onClick={openSearch}
        className="flex h-9 w-full items-center gap-2 border border-white/18 px-2.5 text-[13px] text-rail-muted transition-colors hover:border-white/35 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
      >
        <Search className="size-4" />
        {t('search.open')}
        <kbd className="ml-auto font-mono text-[11px] text-rail-muted">{shortcut}</kbd>
      </button>
    </div>
  )
}

export function RailLabel({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between px-5 pb-2 font-mono text-[11px] font-medium tracking-[0.08em] text-rail-muted uppercase">
      <span>{children}</span>
      {aside}
    </div>
  )
}

export const railItemClass = (active: boolean) =>
  cn(
    'flex h-9 items-center gap-3 px-5 font-mono text-[13px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white',
    active
      ? 'bg-envelope font-bold text-tint [--tint-ink:var(--color-tint)]'
      : 'text-rail-ink hover:bg-white/8 hover:text-white',
  )

function UserMenu() {
  const { t } = useTranslation()
  const { locale, setLocale } = useLocale()
  const { user } = useRouteContext({ from: '/_app' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')

  return (
    <Menu>
      <MenuTrigger className="mx-3 mt-3 flex items-center gap-2.5 rounded-[5px] border-t border-rail-line px-2 pt-3 pb-1 text-left text-[13px] text-rail-ink hover:text-white focus-visible:outline-2 focus-visible:outline-white">
        <span className="grid size-7 shrink-0 place-items-center bg-white/14 font-mono text-[11px] font-semibold text-white">
          {initials || '·'}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{user.name}</span>
          <span className="block truncate font-mono text-[11px] text-rail-muted">{user.email}</span>
        </span>
      </MenuTrigger>
      <MenuContent side="top" align="start" className="w-56">
        <MenuLabel>{t('locale.label')}</MenuLabel>
        {LOCALES.map((option) => (
          <MenuItem key={option} lang={option} onSelect={() => void setLocale(option)}>
            <Check className={cn(option !== locale && 'invisible')} />
            {LOCALE_NAMES[option]}
          </MenuItem>
        ))}
        <MenuSeparator />
        <MenuItem
          onSelect={async () => {
            await authClient.signOut()
            queryClient.clear()
            await navigate({ to: '/entrar' })
          }}
        >
          <LogOut />
          {t('nav.signOut')}
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}
