import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { getToolByHref } from '@/lib/tools'

export const Route = createFileRoute('/ai-ascii')({
  component: AiAsciiPage,
  head: () => ({
    meta: [
      { title: 'AI → ASCII — ascii.smht.eu' },
      {
        name: 'description',
        content:
          'Prompt → Flux Schnell → ASCII art. Lokální rasterizace přes canvas.',
      },
    ],
  }),
})

function AiAsciiPage() {
  const tool = getToolByHref('/ai-ascii')
  const [Tool, setTool] = useState<ComponentType | null>(null)

  useEffect(() => {
    let active = true
    void import('@/components/tools/ai-ascii-tool').then((mod) => {
      if (active) setTool(() => mod.AiAsciiTool)
    })
    return () => {
      active = false
    }
  }, [])

  if (!tool) return null

  return (
    <div>
      <ToolPageHeader tool={tool} />
      {Tool ? (
        <Tool />
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-16 text-center text-sm text-muted-foreground shadow-sm">
          Načítám AI generátor…
        </div>
      )}
    </div>
  )
}
