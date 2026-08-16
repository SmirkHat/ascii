import type { ReactNode } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { SiteShell } from '@/components/layout/site-shell'
import { siteConfig } from '@/lib/site-config'
import appCss from '@/styles/app.css?url'

/** Apply an explicit theme override before the first paint. */
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light")document.documentElement.classList.add(t)}catch(e){}})()`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: siteConfig.title },
      { name: 'description', content: siteConfig.description },
      { name: 'author', content: siteConfig.author },
      {
        name: 'theme-color',
        media: '(prefers-color-scheme: light)',
        content: '#f7f7f5',
      },
      {
        name: 'theme-color',
        media: '(prefers-color-scheme: dark)',
        content: '#171717',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: siteConfig.name },
      { property: 'og:title', content: siteConfig.title },
      { property: 'og:description', content: siteConfig.description },
      { property: 'og:url', content: siteConfig.url },
      { property: 'og:image', content: siteConfig.ogImage },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: siteConfig.twitter },
      { name: 'twitter:title', content: siteConfig.title },
      { name: 'twitter:description', content: siteConfig.description },
      { name: 'twitter:image', content: siteConfig.ogImage },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'me', href: siteConfig.github },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootComponent() {
  return (
    <SiteShell>
      <Outlet />
    </SiteShell>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Přeskočit na obsah
        </a>
        {children}
        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[
              {
                name: 'TanStack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
