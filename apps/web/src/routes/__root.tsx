import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import type { CSSProperties, ReactNode } from 'react'
import { Toaster } from 'sonner'
import appCss from '@/styles.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
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
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
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
