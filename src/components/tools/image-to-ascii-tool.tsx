import { useEffect, useId, useRef, useState } from 'react'
import type { CharacterSetId } from '@/components/tools/character-set-picker'
import { AsciiCanvasPreview } from '@/components/tools/ascii-canvas-preview'
import {
  CHARACTER_SETS,
  CharacterSetPicker,
} from '@/components/tools/character-set-picker'
import type { CodeTokenPoolId } from '@/components/tools/code-language-picker'
import { CodeLanguagePicker } from '@/components/tools/code-language-picker'
import type { DitherModeId } from '@/components/tools/dither-mode-picker'
import { DitherModePicker } from '@/components/tools/dither-mode-picker'
import { ExportPanel } from '@/components/tools/export-panel'
import { ImageUpload } from '@/components/tools/image-upload'
import { Label } from '@/components/ui/label'
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { AsciiArt } from '@/lib/ascii-art'
import { asciiArtToSvg, downloadBlob } from '@/lib/ascii-art'
import { getTokenPool } from '@/lib/code-tokens'
import {
  DEFAULT_IMAGE_TO_ASCII_OPTIONS,
  imageToAsciiArt,
  loadImageSource,
} from '@/lib/image-to-ascii'
import { cn } from '@/lib/utils'

function charsetForId(id: CharacterSetId): string {
  return (
    CHARACTER_SETS.find((set) => set.id === id)?.value ??
    DEFAULT_IMAGE_TO_ASCII_OPTIONS.charset
  )
}

export function ImageToAsciiTool({ className }: { className?: string }) {
  const widthId = useId()
  const invertId = useId()
  const colorId = useId()
  const modeId = useId()
  const [file, setFile] = useState<File | null>(null)
  const [width, setWidth] = useState(DEFAULT_IMAGE_TO_ASCII_OPTIONS.width)
  const [charsetId, setCharsetId] = useState<CharacterSetId>('blocks')
  const [codeLangId, setCodeLangId] = useState<CodeTokenPoolId>('python')
  const [mode, setMode] = useState<'chars' | 'code'>('chars')
  const [dither, setDither] = useState<DitherModeId>('bayer')
  const [invert, setInvert] = useState(DEFAULT_IMAGE_TO_ASCII_OPTIONS.invert)
  const [color, setColor] = useState(true)
  const [art, setArt] = useState<AsciiArt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const sourceRef = useRef<HTMLImageElement | ImageBitmap | null>(null)
  const sourceFileKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!file) {
      sourceRef.current = null
      sourceFileKeyRef.current = null
      setArt(null)
      setError(null)
      setIsRendering(false)
      return
    }

    let cancelled = false
    setIsRendering(true)

    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const fileKey = `${file.name}:${file.size}:${file.lastModified}`
          if (sourceFileKeyRef.current !== fileKey || !sourceRef.current) {
            const loaded = await loadImageSource(file)
            if (cancelled) {
              if (
                typeof ImageBitmap !== 'undefined' &&
                loaded instanceof ImageBitmap
              ) {
                loaded.close()
              }
              return
            }
            if (
              sourceRef.current &&
              typeof ImageBitmap !== 'undefined' &&
              sourceRef.current instanceof ImageBitmap
            ) {
              sourceRef.current.close()
            }
            sourceRef.current = loaded
            sourceFileKeyRef.current = fileKey
          }

          const rendered = await imageToAsciiArt(sourceRef.current, {
            width,
            charset: charsetForId(charsetId),
            invert,
            color,
            dither: mode === 'code' ? 'none' : dither,
            codeTokenPool:
              mode === 'code' ? getTokenPool(codeLangId) : undefined,
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
  }, [file, width, charsetId, invert, color, dither, mode, codeLangId])

  useEffect(() => {
    return () => {
      if (
        sourceRef.current &&
        typeof ImageBitmap !== 'undefined' &&
        sourceRef.current instanceof ImageBitmap
      ) {
        sourceRef.current.close()
      }
    }
  }, [])

  const canExport = Boolean(art?.text.trim()) && !error
  const baseName = file?.name.replace(/\.[^.]+$/, '') || 'ascii-art'

  return (
    <div
      className={cn(
        'grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]',
        className,
      )}
    >
      <aside className="space-y-4">
        <ImageUpload onFileChange={setFile} />

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

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Režim výstupu</Label>
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as 'chars' | 'code')}
            className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background/80 p-1"
          >
            <RadioGroupItem
              value="chars"
              id={`${modeId}-chars`}
              className="rounded-md px-3 py-2 text-xs"
            >
              Znaky
            </RadioGroupItem>
            <RadioGroupItem
              value="code"
              id={`${modeId}-code`}
              className="rounded-md px-3 py-2 text-xs"
            >
              Kód
            </RadioGroupItem>
          </RadioGroup>
        </div>

        {mode === 'chars' ? (
          <CharacterSetPicker
            value={charsetId}
            onValueChange={setCharsetId}
            disabled={false}
          />
        ) : (
          <CodeLanguagePicker
            value={codeLangId}
            onValueChange={setCodeLangId}
            disabled={false}
          />
        )}

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

        <ExportPanel
          disabled={!canExport}
          onCopy={async () => {
            if (art) await navigator.clipboard.writeText(art.text)
          }}
          onDownload={() => {
            if (!art) return
            downloadBlob(
              `${baseName}.txt`,
              art.text,
              'text/plain;charset=utf-8',
            )
          }}
          onDownloadSvg={() => {
            if (!art) return
            const svg = asciiArtToSvg(art, {
              background: art.colored ? '#000000' : '#ffffff',
              foreground: art.colored ? '#ffffff' : '#111111',
            })
            downloadBlob(`${baseName}.svg`, svg, 'image/svg+xml;charset=utf-8')
          }}
        />

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive-foreground">
            {error}
          </p>
        ) : (
          <p className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Textury ovlivní jen mapování jasu. Náhled i SVG zůstávají běžným
            ASCII výstupem.
          </p>
        )}
      </aside>

      <AsciiCanvasPreview
        art={art}
        emptyLabel={
          isRendering
            ? 'Převádím na ASCII…'
            : file
              ? 'Čekám na výstup…'
              : 'Po nahrání obrázku nebo SVG se tady objeví ASCII výstup.'
        }
      />
    </div>
  )
}
