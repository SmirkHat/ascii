import { createFileRoute } from '@tanstack/react-router'
import { AsciiCanvasPreview } from '@/components/tools/ascii-canvas-preview'
import { CharacterSetPicker } from '@/components/tools/character-set-picker'
import { ExportPanel } from '@/components/tools/export-panel'
import { ToolPageHeader } from '@/components/tools/tool-page-header'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getToolByHref } from '@/lib/tools'

export const Route = createFileRoute('/editor')({
  component: EditorPage,
  head: () => ({
    meta: [
      { title: 'Editor — ascii.smht.eu' },
      {
        name: 'description',
        content:
          'Ruční úpravy ASCII výstupu a export. Editor přijde v dalším kroku.',
      },
    ],
  }),
})

function EditorPage() {
  const tool = getToolByHref('/editor')
  if (!tool) return null

  return (
    <div>
      <ToolPageHeader tool={tool} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="editor-input"
              className="text-xs text-muted-foreground"
            >
              ASCII vstup
            </Label>
            <Textarea
              id="editor-input"
              placeholder="Vložte ASCII art ke kontrole…"
              rows={8}
              disabled
              className="font-mono text-xs"
            />
          </div>
          <CharacterSetPicker disabled />
          <ExportPanel disabled />
        </aside>
        <AsciiCanvasPreview emptyLabel="Upravený výstup se zobrazí v náhledu." />
      </div>
    </div>
  )
}
