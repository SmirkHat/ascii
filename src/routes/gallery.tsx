import { createFileRoute } from '@tanstack/react-router'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { getToolByHref } from '@/lib/tools'

export const Route = createFileRoute('/gallery')({
  component: GalleryPage,
  head: () => ({
    meta: [
      { title: 'Galerie — ascii.smht.eu' },
      {
        name: 'description',
        content: 'Prohlížení uložených ASCII skladeb. Úložiště přijde později.',
      },
    ],
  }),
})

function GalleryPage() {
  const tool = getToolByHref('/gallery')
  if (!tool) return null

  return (
    <div>
      <ToolPageHeader tool={tool} />
      <Empty className="rounded-lg border border-dashed border-border bg-card shadow-sm">
        <EmptyHeader>
          <p
            className="mb-4 font-mono text-2xl text-muted-foreground/60"
            aria-hidden="true"
          >
            ▒▒▒
          </p>
          <EmptyTitle>Zatím prázdná galerie</EmptyTitle>
          <EmptyDescription>
            Až budou nástroje ukládat výstupy, objeví se tady přehled skladeb ke
            stažení a dalšímu zpracování.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
