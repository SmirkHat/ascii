import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ToolGrid } from '@/components/tools/tool-grid'
import { tools } from '@/lib/tools'

export const Route = createFileRoute('/')({
  component: HomePage,
  head: () => ({
    meta: [
      { title: 'ascii.smht.eu — nástroje pro ASCII art' },
      {
        name: 'description',
        content:
          'Pracovní sada nástrojů pro převod obrázků a textu na ASCII art, bannery a braille výstup.',
      },
    ],
  }),
})

function HomePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <section className="py-12 text-center md:py-20">
        <p className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          SmirkHat nástroje
        </p>
        <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight md:text-5xl">
          Nástroje pro ASCII art, text a obrázky
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground">
          Lokální pracovní sada pro převody obrázků a textu do textové grafiky.
          Vyberte nástroj a začněte tvořit.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link to="/image-to-ascii">Obrázek → ASCII</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/text-to-banner">Text → banner</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="tools-heading" className="pb-16">
        <div className="mb-6 flex items-end justify-between gap-3">
          <h2
            id="tools-heading"
            className="text-lg font-semibold tracking-tight"
          >
            Nástroje
          </h2>
          <p className="text-sm text-muted-foreground">
            {String(tools.length).padStart(2, '0')} dostupných
          </p>
        </div>
        <ToolGrid />
      </section>
    </div>
  )
}
