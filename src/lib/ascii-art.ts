/**
 * Shared ASCII art result + SVG export.
 */

export type AsciiCell = {
  char: string
  /** CSS color, e.g. #rrggbb */
  color: string
}

export type AsciiArt = {
  text: string
  cols: number
  rows: number
  colored: boolean
  /**
   * Glyph cell width/height used when building the grid.
   * Kept so preview/SVG match the same aspect as the source image.
   */
  cellAspect: number
  /** Row-major cells, length = cols * rows */
  cells: Array<AsciiCell>
}

export type AsciiSvgOptions = {
  fontSize?: number
  background?: string
  /** Used when art is not colored */
  foreground?: string
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) =>
    Math.min(255, Math.max(0, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export function asciiArtToSvg(
  art: AsciiArt,
  options: AsciiSvgOptions = {},
): string {
  const fontSize = options.fontSize ?? 14
  const cellAspect = art.cellAspect > 0 ? art.cellAspect : 0.6
  // line box = fontSize; glyph width chosen so width/height === cellAspect
  const lineHeight = fontSize
  const charWidth = fontSize * cellAspect
  const background = options.background ?? (art.colored ? '#000000' : '#ffffff')
  const foreground = options.foreground ?? (art.colored ? '#ffffff' : '#111111')

  const width = Math.max(1, art.cols * charWidth)
  const height = Math.max(1, art.rows * lineHeight)

  const lines: Array<string> = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="${escapeXml(background)}"/>`,
    `<g font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="${fontSize}" xml:space="preserve">`,
  ]

  const lineTextLength = (art.cols * charWidth).toFixed(2)

  for (let y = 0; y < art.rows; y += 1) {
    const baseline = (y + 1) * lineHeight - lineHeight * 0.2
    let row = `<text x="0" y="${baseline.toFixed(2)}" textLength="${lineTextLength}" lengthAdjust="spacingAndGlyphs">`
    let runChar = ''
    let runColor = ''

    const flush = () => {
      if (!runChar) return
      const fill = art.colored ? runColor : foreground
      row += `<tspan fill="${escapeXml(fill)}">${escapeXml(runChar)}</tspan>`
      runChar = ''
    }

    for (let x = 0; x < art.cols; x += 1) {
      const cell = art.cells[y * art.cols + x] ?? {
        char: ' ',
        color: foreground,
      }
      const ch = cell.char
      const color = cell.color
      if (runChar && color !== runColor) flush()
      if (!runChar) runColor = color
      runChar += ch === ' ' ? '\u00a0' : ch
    }
    flush()
    row += `</text>`
    lines.push(row)
  }

  lines.push(`</g>`, `</svg>`, ``)
  return lines.join('\n')
}

export function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
