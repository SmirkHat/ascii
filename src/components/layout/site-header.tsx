import { Link } from '@tanstack/react-router'
import { MenuIcon } from 'lucide-react'

import { GithubIcon } from '@/components/icons/github'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Sheet,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { siteConfig } from '@/lib/site-config'
import { tools } from '@/lib/tools'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Přehled', href: '/' },
  ...tools.map((tool) => ({ name: tool.title, href: tool.href })),
  { name: 'Font lab', href: '/font-review' },
] as const

const navLinkClass =
  'rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
        <Link
          to="/"
          className="text-lg font-bold tracking-tight transition-colors hover:text-primary"
        >
          ascii.smht.eu
        </Link>

        <nav
          aria-label="Hlavní navigace"
          className="ml-2 hidden min-w-0 flex-1 items-center gap-1 md:flex"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={navLinkClass}
              activeProps={{
                className: 'bg-primary/10 font-bold text-primary',
              }}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
          >
            <GithubIcon className="size-4" aria-hidden="true" />
          </a>

          <ThemeToggle />

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  aria-label="Otevřít menu"
                />
              }
            >
              <MenuIcon className="size-4" aria-hidden="true" />
            </SheetTrigger>
            <SheetPopup side="right" className="w-[min(100%,20rem)]">
              <SheetHeader>
                <SheetTitle className="font-mono">Nástroje</SheetTitle>
              </SheetHeader>
              <SheetPanel className="flex flex-col gap-1">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(navLinkClass, 'px-4')}
                    activeProps={{
                      className: 'bg-primary/10 font-bold text-primary',
                    }}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="mt-4 border-t pt-4">
                  <p className="mb-2 px-4 text-xs text-muted-foreground">
                    Motiv
                  </p>
                  <ThemeToggle />
                </div>
              </SheetPanel>
            </SheetPopup>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
