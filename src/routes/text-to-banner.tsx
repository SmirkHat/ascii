import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { getToolByHref } from '@/lib/tools'

const FigletBannerTool = lazy(async () => {
  const module = await import('@/components/tools/figlet-banner-tool')
  return { default: module.FigletBannerTool }
})

export const Route = createFileRoute('/text-to-banner')({
  component: TextToBannerPage,
  head: () => ({
    meta: [
      { title: 'Text → banner — ascii.smht.eu' },
      {
        name: 'description',
        content:
          'FIGlet textový generátor — všechny vestavěné fonty, kopírování a export.',
      },
    ],
  }),
})

function TextToBannerPage() {
  const tool = getToolByHref('/text-to-banner')
  if (!tool) return null

  return (
    <div>
      <ToolPageHeader tool={tool} />
      <Suspense
        fallback={
          <div className="rounded-lg border border-dashed border-border bg-card px-4 py-16 text-center text-sm text-muted-foreground shadow-sm">
            Načítám FIGlet generátor…
          </div>
        }
      >
        <FigletBannerTool />
      </Suspense>
    </div>
  )
}
