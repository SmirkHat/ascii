import { siteConfig } from '@/lib/site-config'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>
          Vytvořeno{' '}
          <a
            href="https://smirkhat.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            SmirkHat.org
          </a>
        </p>
        <a
          href={siteConfig.github}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-primary"
        >
          Zdrojový kód na GitHubu
        </a>
      </div>
    </footer>
  )
}
