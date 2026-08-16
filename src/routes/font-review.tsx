import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { FontReviewTool } from '@/components/tools/font-review-tool'

export const Route = createFileRoute('/font-review')({
  component: FontReviewPage,
  head: () => ({
    meta: [
      { title: 'Font review — ascii.smht.eu' },
      {
        name: 'description',
        content:
          'Review všech FIGlet fontů s textem AHOJ SVETE a seznamem fontů k vyřazení.',
      },
    ],
  }),
})

function FontReviewPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          to="/text-to-banner"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeftIcon className="size-3.5" />
          Zpět na Text → banner
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="inline-block rounded-full bg-primary/10 px-3 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-primary">
              font lab / review
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              AHOJ SVETE
              <span className="block text-muted-foreground/60">
                bez milosti
              </span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Vizuální síto pro FIGlet katalog. Projdi fonty, označ ty, které
              vypadají špatně, a připrav seznam pro jejich odstranění.
            </p>
          </div>
          <span className="font-mono text-4xl leading-none text-primary/40 sm:text-6xl">
            █▓▒░
          </span>
        </div>
      </div>

      <FontReviewTool />
    </div>
  )
}
