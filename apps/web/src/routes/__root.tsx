import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { Toaster } from 'sonner'
import { LOCALE_COOKIE, getI18n } from '@/i18n'
import { detectLocale, persistLocale } from '@/i18n/locale'
import appCss from '@/styles.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Re-runs on router.invalidate(), which is how a language change takes effect.
  beforeLoad: () => ({ locale: detectLocale() }),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Variables' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  const { locale } = Route.useRouteContext()

  // Pin the detected language in a cookie so server and browser always agree.
  useEffect(() => {
    if (!document.cookie.includes(`${LOCALE_COOKIE}=`)) persistLocale(locale)
  }, [locale])

  return (
    <I18nextProvider i18n={getI18n(locale)}>
      <RootDocument lang={locale}>
        <Outlet />
      </RootDocument>
    </I18nextProvider>
  )
}

function RootDocument({ lang, children }: { lang: string; children: ReactNode }) {
  return (
    <html lang={lang}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          style={
            {
              '--normal-bg': 'var(--color-ground)',
              '--normal-border': 'var(--color-line-strong)',
              '--normal-text': 'var(--color-ink)',
              '--border-radius': '6px',
            } as CSSProperties
          }
          toastOptions={{
            classNames: {
              toast: 'font-sans text-[13px] shadow-[0_10px_30px_-12px_rgb(15_20_45/0.35)]',
              success: '[&_[data-icon]]:text-ok',
              error: '[&_[data-icon]]:text-danger',
            },
          }}
        />
        <Scripts />
      </body>
    </html>
  )
}
