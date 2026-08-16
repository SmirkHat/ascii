/**
 * Image / SVG → ASCII conversion via browser canvas rasterization.
 */

import type { AsciiArt, AsciiCell } from '@/lib/ascii-art'
import { rgbToHex } from '@/lib/ascii-art'
import type { DitherMode } from '@/lib/bayer-dither'
import { bayerNudgeLuminance } from '@/lib/bayer-dither'
import type { CodeTokenPool } from '@/lib/code-tokens'
import { pickToken } from '@/lib/code-tokens'

export type ImageToAsciiOptions = {
  /** Number of character columns. */
  width: number
  charset: string
  invert: boolean
  /**
   * Character cell width/height ratio for monospace fonts (~0.6 for JetBrains Mono).
   */
  characterAspect: number
  /** Sample source RGB onto each character. */
  color: boolean
  /**
   * `bayer` — stronger ordered Bayer texture on the full charset.
   * `bayerSoft` — softer ordered Bayer texture on the full charset.
   */
  dither: DitherMode | 'bayerSoft'
  /** When set, uses code-token blocks instead of single characters. */
  codeTokenPool?: CodeTokenPool
}

export const DEFAULT_IMAGE_TO_ASCII_OPTIONS: ImageToAsciiOptions = {
  width: 80,
  charset: ' .:-=+*#%@',
  invert: false,
  characterAspect: 0.6,
  color: false,
  dither: 'none',
}

/** Rows/cols so rendered output matches source image aspect ratio. */
export function computeAsciiGrid(
  srcW: number,
  srcH: number,
  cols: number,
  cellAspect: number,
): { cols: number; rows: number } {
  const safeCols = Math.max(1, Math.round(cols))
  const aspect = cellAspect > 0 ? cellAspect : 0.6
  const rows = Math.max(1, Math.round((srcH / srcW) * safeCols * aspect))
  return { cols: safeCols, rows }
}

export type { DitherMode }

const SVG_FALLBACK_SIZE = 512

export function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export function mapLuminanceToChar(
  lum: number,
  charset: string,
  invert: boolean,
): string {
  if (charset.length === 0) return ' '
  const clamped = Math.min(255, Math.max(0, lum))
  const normalized = invert ? clamped / 255 : 1 - clamped / 255
  const index = Math.min(
    charset.length - 1,
    Math.floor(normalized * charset.length),
  )
  return charset[index] ?? ' '
}

function isSvgFile(file: File): boolean {
  return (
    file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
  )
}

function parseViewBox(
  svgText: string,
): { width: number; height: number } | null {
  const match = svgText.match(
    /viewBox\s*=\s*["']?\s*([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/i,
  )
  if (!match) return null
  const width = Number(match[3])
  const height = Number(match[4])
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null
  }
  return { width, height }
}

function hasExplicitSvgSize(svgText: string): boolean {
  const openTag = svgText.match(/<svg\b[^>]*>/i)?.[0] ?? ''
  const hasWidth = /\bwidth\s*=/i.test(openTag)
  const hasHeight = /\bheight\s*=/i.test(openTag)
  return hasWidth && hasHeight
}

async function prepareSvgBlob(file: File): Promise<Blob> {
  const text = await file.text()
  if (hasExplicitSvgSize(text)) {
    return new Blob([text], { type: 'image/svg+xml' })
  }

  const viewBox = parseViewBox(text)
  const width = viewBox?.width ?? SVG_FALLBACK_SIZE
  const height = viewBox?.height ?? SVG_FALLBACK_SIZE

  const patched = text.replace(/<svg\b([^>]*)>/i, (_full, attrs: string) => {
    let next = attrs
    if (!/\bwidth\s*=/i.test(next)) {
      next += ` width="${width}"`
    }
    if (!/\bheight\s*=/i.test(next)) {
      next += ` height="${height}"`
    }
    return `<svg${next}>`
  })

  return new Blob([patched], { type: 'image/svg+xml' })
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.decoding = 'async'

    img.onload = () => {
      URL.revokeObjectURL(url)
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        // Keep a non-square fallback only when we truly have no intrinsic size.
        img.width = SVG_FALLBACK_SIZE
        img.height = Math.round(SVG_FALLBACK_SIZE * 0.75)
      }
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Nepodařilo se načíst obrázek nebo SVG.'))
    }

    img.src = url
  })
}

export async function loadImageSource(
  file: File,
): Promise<HTMLImageElement | ImageBitmap> {
  if (isSvgFile(file)) {
    const blob = await prepareSvgBlob(file)
    return loadImageFromBlob(blob)
  }

  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      // Fall through to <img> path for exotic/unsupported types.
    }
  }

  return loadImageFromBlob(file)
}

function getSourceSize(source: ImageBitmap | HTMLImageElement | ImageData): {
  width: number
  height: number
} {
  if (source instanceof ImageData) {
    return { width: source.width, height: source.height }
  }
  if ('naturalWidth' in source && source.naturalWidth > 0) {
    return { width: source.naturalWidth, height: source.naturalHeight }
  }
  return {
    width: source.width || SVG_FALLBACK_SIZE,
    height: source.height || SVG_FALLBACK_SIZE,
  }
}

function createWorkCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

export async function imageToAsciiArt(
  source: ImageBitmap | HTMLImageElement | ImageData,
  options: Partial<ImageToAsciiOptions> = {},
): Promise<AsciiArt> {
  const {
    width: cols,
    charset,
    invert,
    characterAspect: aspectOption,
    color,
    dither,
    codeTokenPool,
  } = { ...DEFAULT_IMAGE_TO_ASCII_OPTIONS, ...options }

  if (cols < 1) {
    throw new Error('Šířka musí být alespoň 1.')
  }
  if (!charset) {
    throw new Error('Znaková sada nesmí být prázdná.')
  }

  const { width: srcW, height: srcH } = getSourceSize(source)
  if (srcW < 1 || srcH < 1) {
    throw new Error('Obrázek má neplatné rozměry.')
  }

  const cellAspect = aspectOption

  const { cols: gridCols, rows } = computeAsciiGrid(
    srcW,
    srcH,
    cols,
    cellAspect,
  )

  const canvas = createWorkCanvas(gridCols, rows)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    throw new Error('Canvas 2D není dostupný.')
  }

  // Keep the work canvas transparent so transparent source pixels stay blank.
  // Rows already account for glyph cellAspect so the rendered ASCII matches
  // the source image proportions.
  ctx.clearRect(0, 0, gridCols, rows)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  if (source instanceof ImageData) {
    const temp = createWorkCanvas(source.width, source.height)
    const tempCtx = temp.getContext('2d')
    if (!tempCtx) {
      throw new Error('Canvas 2D není dostupný.')
    }
    tempCtx.putImageData(source, 0, 0)
    ctx.drawImage(temp, 0, 0, gridCols, rows)
  } else {
    ctx.drawImage(source, 0, 0, gridCols, rows)
  }

  const { data } = ctx.getImageData(0, 0, gridCols, rows)
  const lines: Array<string> = []
  const cells: Array<AsciiCell> = []

  if (codeTokenPool) {
    const tokenW = codeTokenPool.width
    const tokenCols = Math.max(1, Math.floor(gridCols / tokenW))
    if (tokenCols < 1) {
      throw new Error('Obrázek je příliš úzký pro zvolenou šířku tokenů.')
    }
    const outputWidth = tokenCols * tokenW

    for (let ty = 0; ty < rows; ty += 1) {
      const row: string[] = []
      for (let tx = 0; tx < tokenCols; tx += 1) {
        let sum = 0
        let count = 0
        for (let ox = 0; ox < tokenW; ox += 1) {
          const px = tx * tokenW + ox
          if (px >= gridCols) continue
          const i = (ty * gridCols + px) * 4
          const r = data[i] ?? 0
          const g = data[i + 1] ?? 0
          const b = data[i + 2] ?? 0
          const a = data[i + 3] ?? 255
          const alpha = a / 255
          const cr = r * alpha + 255 * (1 - alpha)
          const cg = g * alpha + 255 * (1 - alpha)
          const cb = b * alpha + 255 * (1 - alpha)
          sum += luminance(cr, cg, cb)
          count += 1
        }
        const avgLum = count > 0 ? sum / count / 255 : 1
        const token = pickToken(codeTokenPool, avgLum, invert)
        row.push(token)
        if (color) {
          const ci = (ty * gridCols + tx * tokenW) * 4
          const cr2 =
            (data[ci] ?? 0) * ((data[ci + 3] ?? 255) / 255) +
            255 * (1 - (data[ci + 3] ?? 255) / 255)
          const cg2 =
            (data[ci + 1] ?? 0) * ((data[ci + 3] ?? 255) / 255) +
            255 * (1 - (data[ci + 3] ?? 255) / 255)
          const cb2 =
            (data[ci + 2] ?? 0) * ((data[ci + 3] ?? 255) / 255) +
            255 * (1 - (data[ci + 3] ?? 255) / 255)
          for (const char of token) {
            cells.push({
              char,
              color: rgbToHex(cr2, cg2, cb2),
            })
          }
        } else {
          for (const char of token) {
            cells.push({ char, color: '#222222' })
          }
        }
      }
      lines.push(row.join(''))
    }

    return {
      text: lines.join('\n'),
      cols: outputWidth,
      rows,
      colored: color,
      cellAspect: 1,
      cells,
    }
  }

  for (let y = 0; y < rows; y += 1) {
    let line = ''
    for (let x = 0; x < gridCols; x += 1) {
      const i = (y * gridCols + x) * 4
      const r = data[i] ?? 0
      const g = data[i + 1] ?? 0
      const b = data[i + 2] ?? 0
      const a = data[i + 3] ?? 255
      // Composite over white already done via fill; still blend residual alpha.
      const alpha = a / 255
      const cr = r * alpha + 255 * (1 - alpha)
      const cg = g * alpha + 255 * (1 - alpha)
      const cb = b * alpha + 255 * (1 - alpha)
      const lum01 = luminance(cr, cg, cb) / 255

      let char: string
      if (alpha === 0) {
        char = charset.charAt(0) || ' '
      } else if (dither === 'bayer') {
        const nudged = bayerNudgeLuminance(x, y, lum01, 0.5)
        char = mapLuminanceToChar(nudged * 255, charset, invert)
      } else if (dither === 'bayerSoft') {
        const nudged = bayerNudgeLuminance(x, y, lum01)
        char = mapLuminanceToChar(nudged * 255, charset, invert)
      } else {
        char = mapLuminanceToChar(lum01 * 255, charset, invert)
      }

      line += char
      cells.push({
        char,
        color: rgbToHex(cr, cg, cb),
      })
    }
    lines.push(line)
  }

  return {
    text: lines.join('\n'),
    cols: gridCols,
    rows,
    colored: color,
    cellAspect,
    cells,
  }
}

export async function imageToAscii(
  source: ImageBitmap | HTMLImageElement | ImageData,
  options: Partial<ImageToAsciiOptions> = {},
): Promise<string> {
  const art = await imageToAsciiArt(source, options)
  return art.text
}
