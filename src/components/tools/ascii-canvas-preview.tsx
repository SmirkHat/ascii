import type { ReactNode } from 'react'
import type { AsciiArt } from '@/lib/ascii-art'
import { cn } from '@/lib/utils'

type AsciiCanvasPreviewProps = {
  content?: string
  art?: AsciiArt | null
  emptyLabel?: string
  className?: string
  children?: ReactNode
}

export function AsciiCanvasPreview({
  content,
  art,
  emptyLabel = 'Výstup se zobrazí zde',
  className,
  children,
}: AsciiCanvasPreviewProps) {
  const plain = content ?? art?.text ?? ''
  const showColor = Boolean(art?.colored && art.cells.length > 0)
  const hasContent = Boolean(plain.trim().length > 0 || showColor)
  const cellAspect =
    art?.cellAspect && art.cellAspect > 0 ? art.cellAspect : 0.6
  const textFontSize = 11
  const textLineHeight = textFontSize
  const textCharWidth = textFontSize * cellAspect

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-card shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
          Náhled
        </p>
        <p className="font-mono text-[0.65rem] text-muted-foreground">
          {showColor ? 'color' : 'canvas'}
        </p>
      </div>
      <div
        className={cn(
          'min-h-56 overflow-auto p-4',
          showColor
            ? 'bg-black'
            : 'bg-[color-mix(in_srgb,var(--foreground)_2.5%,transparent)]',
        )}
      >
        {hasContent && showColor && art ? (
          <pre
            className="overflow-auto font-ascii whitespace-pre [font-variant-ligatures:none]"
            style={{
              fontSize: textFontSize,
              lineHeight: `${textLineHeight}px`,
              letterSpacing: 0,
            }}
          >
            {Array.from({ length: art.rows }, (_row, y) => (
              <span
                key={y}
                className="block"
                style={{ height: textLineHeight }}
              >
                {Array.from({ length: art.cols }, (_col, x) => {
                  const cell = art.cells[y * art.cols + x] ?? {
                    char: ' ',
                    color: '#ffffff',
                  }
                  return (
                    <span
                      key={x}
                      style={{
                        color: cell.color,
                        display: 'inline-block',
                        width: textCharWidth,
                        height: textLineHeight,
                        textAlign: 'center',
                      }}
                    >
                      {cell.char}
                    </span>
                  )
                })}
              </span>
            ))}
          </pre>
        ) : hasContent ? (
          <pre
            className="overflow-auto font-ascii text-foreground whitespace-pre [font-variant-ligatures:none]"
            style={{
              fontSize: textFontSize,
              lineHeight: `${textLineHeight}px`,
            }}
          >
            {plain}
          </pre>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
            <span
              aria-hidden="true"
              className="font-mono text-2xl leading-none text-muted-foreground/50"
            >
              ·· ·· ··
            </span>
            <p className="max-w-xs text-sm text-muted-foreground">
              {emptyLabel}
            </p>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
