import { createFileRoute } from '@tanstack/react-router'
import { AsciiCanvasPreview } from '@/components/tools/ascii-canvas-preview'
import { CharacterSetPicker } from '@/components/tools/character-set-picker'
import { ExportPanel } from '@/components/tools/export-panel'
import { ImageUpload } from '@/components/tools/image-upload'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { getToolByHref } from '@/lib/tools'

export const Route = createFileRoute('/braille')({
  component: BraillePage,
  head: () => ({
    meta: [
      { title: 'Braille art — ascii.smht.eu' },
      {
        name: 'description',
        content: 'Hustší ASCII přes braille znaky. Algoritmus přijde později.',
      },
    ],
  }),
})

function BraillePage() {
  const tool = getToolByHref('/braille')
  if (!tool) return null

  return (
    <div>
      <ToolPageHeader tool={tool} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <aside className="space-y-4">
          <ImageUpload />
          <CharacterSetPicker value="braille" disabled />
          <ExportPanel disabled />
        </aside>
        <AsciiCanvasPreview emptyLabel="Braille výstup se zobrazí v tomto náhledu." />
      </div>
    </div>
  )
}
