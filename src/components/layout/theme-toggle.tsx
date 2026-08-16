import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'

/** A small JS enhancement over the CSS system-first theme. */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark =
      root.classList.contains('dark') ||
      (systemDark && !root.classList.contains('light'))
    const next = isDark ? 'light' : 'dark'

    root.classList.remove('light', 'dark')
    root.classList.add(next)
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Storage can be unavailable in private browsing; the session still works.
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Přepnout motiv"
    >
      <Sun className="size-4 dark:hidden" aria-hidden="true" />
      <Moon className="hidden size-4 dark:block" aria-hidden="true" />
    </Button>
  )
}
