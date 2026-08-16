import { useEffect, useId, useState } from 'react'
import { AsciiCanvasPreview } from '@/components/tools/ascii-canvas-preview'
import { ExportPanel } from '@/components/tools/export-panel'
import { FigletFontPicker } from '@/components/tools/figlet-font-picker'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  DEFAULT_FIGLET_OPTIONS,
  preloadFigletRenderer,
  renderFiglet,
} from '@/lib/figlet'
import type { FigletFontName, FigletHorizontalLayout } from '@/lib/figlet'
import { cn } from '@/lib/utils'

type LayoutOption = {
  label: string
  value: FigletHorizontalLayout
}

const LAYOUT_OPTIONS: Array<LayoutOption> = [
  { label: 'Full (doporučeno pro pixel)', value: 'full' },
  { label: 'Výchozí', value: 'default' },
  { label: 'Fitted', value: 'fitted' },
  { label: 'Controlled smushing', value: 'controlled smushing' },
  { label: 'Universal smushing', value: 'universal smushing' },
]

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function FigletBannerTool({ className }: { className?: string }) {
  const textId = useId()
  const layoutLabelId = useId()
  const [text, setText] = useState('ascii.smht')
  const [font, setFont] = useState<FigletFontName>(DEFAULT_FIGLET_OPTIONS.font)
  const [layout, setLayout] = useState<LayoutOption>(LAYOUT_OPTIONS[0])
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)

  useEffect(() => {
    preloadFigletRenderer()
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsRendering(true)

    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const rendered = await renderFiglet(text, {
            font,
            horizontalLayout: layout.value,
          })
          if (!cancelled) {
            setOutput(rendered)
            setError(null)
          }
        } catch (cause) {
          if (!cancelled) {
            setOutput('')
            setError(
              cause instanceof Error
                ? cause.message
                : 'Nepodařilo se vykreslit banner.',
            )
          }
        } finally {
          if (!cancelled) setIsRendering(false)
        }
      })()
    }, 120)

    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [text, font, layout])

  const canExport = output.trim().length > 0 && !error

  return (
    <div
      className={cn(
        'grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]',
        className,
      )}
    >
      <aside className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={textId} className="text-xs text-muted-foreground">
            Vstupní text
          </Label>
          <Textarea
            id={textId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Např. SMHT"
            rows={4}
            className="font-mono"
          />
        </div>

        <FigletFontPicker value={font} onValueChange={setFont} />

        <div className="space-y-2">
          <Label id={layoutLabelId} className="text-xs text-muted-foreground">
            Horizontální layout
          </Label>
          <Select
            items={LAYOUT_OPTIONS}
            value={layout}
            onValueChange={(next) => {
              if (next) setLayout(next)
            }}
            itemToStringValue={(item) => item.value}
          >
            <SelectTrigger aria-labelledby={layoutLabelId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {LAYOUT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <ExportPanel
          disabled={!canExport}
          onCopy={async () => {
            await navigator.clipboard.writeText(output)
          }}
          onDownload={() => {
            downloadText(`figlet-${font}.txt`, output)
          }}
        />

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive-foreground">
            {error}
          </p>
        ) : (
          <p className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            GGBotNet pixel fonty (█) + klasický FIGlet. Vlastní fonty jsou
            nahoře ve filtru — Ithaca, HomeVideo, Pixeloid… Diakritika se
            zachová, pokud ji font umí, jinak se převede na základní písmeno.
          </p>
        )}
      </aside>

      <AsciiCanvasPreview
        content={output}
        emptyLabel={
          isRendering
            ? 'Vykresluji banner…'
            : 'Napište text a vyberte font pro náhled.'
        }
      />
    </div>
  )
}
