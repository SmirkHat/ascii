import {
  memo,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  CircleCheckIcon,
  CopyIcon,
  LoaderCircleIcon,
  SearchIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  CUSTOM_FIGLET_FONTS,
  FIGLET_FONTS,
  preloadFigletRenderer,
  renderFiglet,
} from '@/lib/figlet'
import { cn } from '@/lib/utils'

const REVIEW_TEXT = 'AHOJ SVETE'
const RENDER_CONCURRENCY = 8

type ReviewFont = {
  name: string
  group: 'pixel' | 'figlet'
  index: number
}

const REVIEW_FONTS: ReadonlyArray<ReviewFont> = FIGLET_FONTS.map(
  (name, index) => ({
    name,
    group: CUSTOM_FIGLET_FONTS.includes(name) ? 'pixel' : 'figlet',
    index,
  }),
)

type FontReviewCardProps = {
  font: ReviewFont
  output?: string
  error?: string
  rejected: boolean
  onToggle: (font: string) => void
}

const FontReviewCard = memo(function FontReviewCard({
  font,
  output,
  error,
  rejected,
  onToggle,
}: FontReviewCardProps) {
  return (
    <article
      className={cn(
        'font-review-card overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-[border-color,background-color] duration-150',
        rejected && 'border-destructive/60 bg-destructive/5',
      )}
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.65rem] text-muted-foreground">
              {String(font.index + 1).padStart(3, '0')}
            </span>
            <h2 className="truncate text-sm font-semibold tracking-tight">
              {font.name}
            </h2>
          </div>
          <Badge
            variant="outline"
            className="font-mono text-[0.6rem] uppercase tracking-wider"
          >
            {font.group}
          </Badge>
        </div>
        <Button
          type="button"
          size="sm"
          variant={rejected ? 'destructive' : 'outline'}
          aria-pressed={rejected}
          aria-label={
            rejected
              ? `Vrátit font ${font.name}`
              : `Označit font ${font.name} k vyřazení`
          }
          onClick={() => onToggle(font.name)}
        >
          {rejected ? <CircleCheckIcon className="size-3.5" /> : null}
          {rejected ? 'Vrátit' : 'Vyřadit'}
        </Button>
      </div>

      <div className="border-t border-border bg-[color-mix(in_srgb,var(--foreground)_2.5%,transparent)] p-4">
        {output !== undefined ? (
          <pre className="max-h-56 min-h-28 overflow-auto font-ascii text-[0.58rem] leading-[1.05] text-foreground whitespace-pre [font-variant-ligatures:none]">
            {output}
          </pre>
        ) : error ? (
          <div className="flex min-h-28 flex-col justify-center gap-1 text-xs text-destructive-foreground">
            <p className="font-semibold">Font se nepodařilo načíst.</p>
            <p className="break-words text-destructive/80">{error}</p>
          </div>
        ) : (
          <div className="flex min-h-28 items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircleIcon className="size-4 animate-spin" />
            <span>Vykresluji…</span>
          </div>
        )}
      </div>
    </article>
  )
})

export function FontReviewTool() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [outputs, setOutputs] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [completed, setCompleted] = useState(0)
  const [isRendering, setIsRendering] = useState(true)
  const [showCards, setShowCards] = useState(false)
  const [rejectedFonts, setRejectedFonts] = useState<Set<string>>(
    () => new Set(),
  )
  const [copied, setCopied] = useState(false)

  const filteredFonts = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase()
    if (!needle) return REVIEW_FONTS
    return REVIEW_FONTS.filter((font) =>
      font.name.toLowerCase().includes(needle),
    )
  }, [deferredQuery])

  const rejectedList = useMemo(
    () => REVIEW_FONTS.filter((font) => rejectedFonts.has(font.name)),
    [rejectedFonts],
  )

  const allVisibleRejected =
    filteredFonts.length > 0 &&
    filteredFonts.every((font) => rejectedFonts.has(font.name))

  const toggleRejected = useCallback((fontName: string) => {
    setRejectedFonts((current) => {
      const next = new Set(current)
      if (next.has(fontName)) next.delete(fontName)
      else next.add(fontName)
      return next
    })
  }, [])

  const toggleVisible = useCallback(() => {
    setRejectedFonts((current) => {
      const next = new Set(current)
      for (const font of filteredFonts) {
        if (allVisibleRejected) next.delete(font.name)
        else next.add(font.name)
      }
      return next
    })
  }, [allVisibleRejected, filteredFonts])

  const clearRejected = useCallback(() => {
    setRejectedFonts(new Set())
  }, [])

  const rejectedText = rejectedList.map((font) => font.name).join('\n')

  const copyRejected = useCallback(async () => {
    if (!rejectedText) return
    await navigator.clipboard.writeText(rejectedText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }, [rejectedText])

  useEffect(() => {
    let cancelled = false
    let nextIndex = 0
    let finished = 0
    let flushTimer: number | null = null
    const outputBatch = new Map<string, string>()
    const errorBatch = new Map<string, string>()

    const flush = () => {
      flushTimer = null
      if (cancelled) return

      const nextOutputs = Object.fromEntries(outputBatch)
      const nextErrors = Object.fromEntries(errorBatch)
      outputBatch.clear()
      errorBatch.clear()

      startTransition(() => {
        if (Object.keys(nextOutputs).length > 0) {
          setOutputs((current) => ({ ...current, ...nextOutputs }))
        }
        if (Object.keys(nextErrors).length > 0) {
          setErrors((current) => ({ ...current, ...nextErrors }))
        }
        setCompleted(finished)
      })
    }

    const scheduleFlush = () => {
      if (flushTimer !== null) return
      flushTimer = window.setTimeout(flush, 60)
    }

    const renderWorker = async () => {
      // The cleanup callback mutates this flag while workers are awaiting fonts.
      while (!cancelled) {
        const font = REVIEW_FONTS[nextIndex]
        nextIndex += 1
        try {
          const output = await renderFiglet(REVIEW_TEXT, {
            font: font.name,
            horizontalLayout: 'full',
          })
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (!cancelled) outputBatch.set(font.name, output)
        } catch (cause) {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (!cancelled) {
            errorBatch.set(
              font.name,
              cause instanceof Error
                ? cause.message
                : 'Neznámá chyba při vykreslení.',
            )
          }
        } finally {
          finished += 1
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (!cancelled) scheduleFlush()
        }
      }
    }

    setShowCards(true)
    preloadFigletRenderer()
    void Promise.all(
      Array.from(
        { length: Math.min(RENDER_CONCURRENCY, REVIEW_FONTS.length) },
        () => renderWorker(),
      ),
    ).then(() => {
      if (cancelled) return
      if (flushTimer !== null) window.clearTimeout(flushTimer)
      flush()
      setIsRendering(false)
    })

    return () => {
      cancelled = true
      if (flushTimer !== null) window.clearTimeout(flushTimer)
    }
  }, [])

  const progress = Math.round((completed / REVIEW_FONTS.length) * 100)

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-primary/25 bg-primary/5 p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-mono text-[0.65rem] uppercase tracking-widest text-primary">
              specimen / 001
            </p>
            <h2 className="text-lg font-semibold tracking-tight">
              Označ fonty, které půjdou pryč
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Projdi si stejné slovo ve všech dostupných řezech. Výběr níže je
              pracovní seznam pro odstranění z aplikace.
            </p>
          </div>
          <Badge variant="outline" className="font-mono">
            {completed}/{REVIEW_FONTS.length} načteno
          </Badge>
        </div>

        <div className="mt-5 h-1 overflow-hidden rounded-full bg-primary/15">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-[0.65rem] text-muted-foreground">
          {isRendering
            ? `Vykresluji ${REVIEW_TEXT}… ${progress}%`
            : `Hotovo — ${REVIEW_FONTS.length} fontů připraveno k posouzení.`}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <main className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filtrovat fonty…"
                aria-label="Filtrovat fonty v review"
                className="pl-9 font-mono"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={toggleVisible}
                disabled={filteredFonts.length === 0}
              >
                {allVisibleRejected
                  ? 'Odznačit viditelné'
                  : 'Označit viditelné'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={clearRejected}
                disabled={rejectedFonts.size === 0}
              >
                Vyčistit výběr
              </Button>
            </div>
          </div>

          <p className="px-1 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            {filteredFonts.length} z {REVIEW_FONTS.length} fontů
          </p>

          {showCards ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredFonts.map((font) => (
                <FontReviewCard
                  key={font.name}
                  font={font}
                  output={outputs[font.name]}
                  error={errors[font.name]}
                  rejected={rejectedFonts.has(font.name)}
                  onToggle={toggleRejected}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card px-4 py-16 text-center text-sm text-muted-foreground shadow-sm">
              Připravuji katalog fontů…
            </div>
          )}
        </main>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  shortlist
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  K vyřazení
                </h2>
              </div>
              <Badge
                variant={rejectedList.length > 0 ? 'destructive' : 'outline'}
              >
                {rejectedList.length}
              </Badge>
            </div>

            <Textarea
              readOnly
              value={rejectedText}
              rows={8}
              placeholder="Zatím nemáš označený žádný font."
              className="mt-4 resize-none font-mono text-xs"
              aria-label="Seznam fontů k vyřazení"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 w-full"
              disabled={rejectedList.length === 0}
              onClick={() => void copyRejected()}
            >
              {copied ? (
                <CircleCheckIcon className="size-4" />
              ) : (
                <CopyIcon className="size-4" />
              )}
              {copied ? 'Seznam zkopírován' : 'Zkopírovat seznam'}
            </Button>
          </section>

          <section className="rounded-lg border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Jak pokračovat</p>
            <p className="mt-2 leading-relaxed">
              Označ všechno, co nechceš v aplikaci. Pak mi pošli seznam nebo
              napiš „odstraň označené“ — odstraním je z nabídky i z balíčku.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
