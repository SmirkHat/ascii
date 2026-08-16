import { useEffect, useId, useRef, useState } from 'react'
import type { CharacterSetId } from '@/components/tools/character-set-picker'
import { AsciiCanvasPreview } from '@/components/tools/ascii-canvas-preview'
import {
  CHARACTER_SETS,
  CharacterSetPicker,
} from '@/components/tools/character-set-picker'
import type { DitherModeId } from '@/components/tools/dither-mode-picker'
import { DitherModePicker } from '@/components/tools/dither-mode-picker'
import { ExportPanel } from '@/components/tools/export-panel'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { AsciiArt } from '@/lib/ascii-art'
import { asciiArtToSvg, downloadBlob } from '@/lib/ascii-art'
import { generateImage } from '@/lib/generate-image'
import {
  DEFAULT_IMAGE_TO_ASCII_OPTIONS,
  imageToAsciiArt,
} from '@/lib/image-to-ascii'
import { cn } from '@/lib/utils'

function charsetForId(id: CharacterSetId): string {
  return (
    CHARACTER_SETS.find((set) => set.id === id)?.value ??
    DEFAULT_IMAGE_TO_ASCII_OPTIONS.charset
  )
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () =>
      reject(new Error('Nepodařilo se načíst vygenerovaný obrázek.'))
    img.src = dataUrl
  })
}

export function AiAsciiTool({ className }: { className?: string }) {
  const promptId = useId()
  const stepsId = useId()
  const widthId = useId()
  const invertId = useId()
  const colorId = useId()

  const [prompt, setPrompt] = useState('cute robot cat, simple shapes')
  const [steps, setSteps] = useState(4)
  const [width, setWidth] = useState(DEFAULT_IMAGE_TO_ASCII_OPTIONS.width)
  const [charsetId, setCharsetId] = useState<CharacterSetId>('blocks')
  const [dither, setDither] = useState<DitherModeId>('bayer')
  const [invert, setInvert] = useState(DEFAULT_IMAGE_TO_ASCII_OPTIONS.invert)
  const [color, setColor] = useState(true)

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [art, setArt] = useState<AsciiArt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRendering, setIsRendering] = useState(false)

  const sourceRef = useRef<HTMLImageElement | null>(null)
  const sourceKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!imageDataUrl) {
      sourceRef.current = null
      sourceKeyRef.current = null
      setArt(null)
      setIsRendering(false)
      return
    }

    let cancelled = false
    setIsRendering(true)

    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          if (sourceKeyRef.current !== imageDataUrl || !sourceRef.current) {
            const loaded = await loadImageFromDataUrl(imageDataUrl)
            if (cancelled) return
            sourceRef.current = loaded
            sourceKeyRef.current = imageDataUrl
          }

          const rendered = await imageToAsciiArt(sourceRef.current, {
            width,
            charset: charsetForId(charsetId),
            invert,
            color,
            dither,
          })

          if (!cancelled) {
            setArt(rendered)
            setError(null)
          }
        } catch (cause) {
          if (!cancelled) {
            setArt(null)
            setError(
              cause instanceof Error
                ? cause.message
                : 'Nepodařilo se převést obrázek na ASCII.',
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
  }, [imageDataUrl, width, charsetId, invert, color, dither])

  async function handleGenerate() {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateImage({
        data: { prompt, steps },
      })
      setImageDataUrl(result.imageDataUrl)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Nepodařilo se vygenerovat obrázek.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const canExport = Boolean(art?.text.trim()) && !error
  const busy = isGenerating || isRendering

  return (
    <div
      className={cn(
        'grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]',
        className,
      )}
    >
      <aside className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={promptId} className="text-xs text-muted-foreground">
            Prompt
          </Label>
          <Textarea
            id={promptId}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Např. cute robot cat"
            rows={4}
            className="font-mono"
            disabled={isGenerating}
          />
          <Button
            type="button"
            className="w-full"
            disabled={isGenerating || prompt.trim().length === 0}
            onClick={() => {
              void handleGenerate()
            }}
          >
            {isGenerating ? 'Generuji…' : 'Generovat'}
          </Button>
        </div>

        <NumberField
          id={stepsId}
          value={steps}
          onValueChange={(next) => {
            if (typeof next === 'number' && Number.isFinite(next)) {
              setSteps(Math.min(8, Math.max(1, Math.round(next))))
            }
          }}
          min={1}
          max={8}
          step={1}
          disabled={isGenerating}
        >
          <Label htmlFor={stepsId} className="text-xs text-muted-foreground">
            Steps (1–8)
          </Label>
          <NumberFieldGroup>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldGroup>
        </NumberField>

        <NumberField
          id={widthId}
          value={width}
          onValueChange={(next) => {
            if (typeof next === 'number' && Number.isFinite(next)) {
              setWidth(Math.min(200, Math.max(40, Math.round(next))))
            }
          }}
          min={40}
          max={200}
          step={1}
        >
          <Label htmlFor={widthId} className="text-xs text-muted-foreground">
            Šířka (sloupce)
          </Label>
          <NumberFieldGroup>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldGroup>
        </NumberField>

        <DitherModePicker value={dither} onValueChange={setDither} />

        <CharacterSetPicker
          value={charsetId}
          onValueChange={setCharsetId}
          disabled={false}
        />

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/80 px-3 py-2.5">
          <Label htmlFor={colorId} className="text-xs text-muted-foreground">
            Barvy z obrázku
          </Label>
          <Switch id={colorId} checked={color} onCheckedChange={setColor} />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/80 px-3 py-2.5">
          <Label htmlFor={invertId} className="text-xs text-muted-foreground">
            Invertovat
          </Label>
          <Switch id={invertId} checked={invert} onCheckedChange={setInvert} />
        </div>

        {imageDataUrl ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Zdrojový obrázek</p>
            <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
              <img
                src={imageDataUrl}
                alt=""
                className="mx-auto max-h-40 w-full object-contain"
              />
            </div>
          </div>
        ) : null}

        <ExportPanel
          disabled={!canExport}
          onCopy={async () => {
            if (art) await navigator.clipboard.writeText(art.text)
          }}
          onDownload={() => {
            if (!art) return
            downloadBlob('ai-ascii.txt', art.text, 'text/plain;charset=utf-8')
          }}
          onDownloadSvg={() => {
            if (!art) return
            const svg = asciiArtToSvg(art, {
              background: art.colored ? '#000000' : '#ffffff',
              foreground: art.colored ? '#ffffff' : '#111111',
            })
            downloadBlob('ai-ascii.svg', svg, 'image/svg+xml;charset=utf-8')
          }}
        />

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive-foreground">
            {error}
          </p>
        ) : (
          <p className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Flux → ASCII s barvami a SVG exportem. Změna šířky/charsetu
            nepřegeneruje obrázek.
          </p>
        )}
      </aside>

      <AsciiCanvasPreview
        art={art}
        emptyLabel={
          isGenerating
            ? 'Generuji obrázek…'
            : isRendering
              ? 'Převádím na ASCII…'
              : busy
                ? 'Pracuji…'
                : 'Napište prompt a klikněte Generovat.'
        }
      />
    </div>
  )
}
