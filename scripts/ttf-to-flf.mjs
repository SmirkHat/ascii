#!/usr/bin/env node
/**
 * Convert pixel TTF/OTF fonts → FIGlet .flf using full blocks (█) + spaces.
 * No half-blocks.
 *
 * Usage: node scripts/ttf-to-flf.mjs
 */
import { createCanvas } from '@napi-rs/canvas'
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
} from 'node:fs'
import { basename, dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_DIR = join(ROOT, 'fonts/source')
const OUT_DIR = join(ROOT, 'fonts/flf')
const RAW_DIR = join(ROOT, 'src/fonts/flf')

const HARDBLANK = '$'
const ENDMARK = '@'
const INK = '█'
const THRESHOLD = 32 // alpha or coverage

/** Preferred render sizes (px) when known from designer notes. */
const SIZE_HINTS = {
  PublicPixel: 8,
  PixeloidSans: 9,
  'PixeloidSans-Bold': 9,
  PixeloidMono: 9,
  'HomeVideo-Regular': 20,
  'HomeVideo-Bold': 20,
  RasterForge: 5,
  Gridtile: 16,
  Ithaca: 16,
  Cairopixel: 8,
  Pixelbasel: 8,
  DarkByte: 8,
  Bitrimus: 8,
  Pixelzone: 8,
  Vaticanus: 16,
  'Zeitmax-Regular': 16,
  'Zeitmax-Italic': 16,
  Yazo: 16,
  'Fortzilla-Regular': 16,
  'Fortzilla-Italic': 16,
  'Fortzilla-Light': 16,
  'Fortzilla-Light-Italic': 16,
  Pixelated_Elegance: 16,
}

const REQUIRED_CHARS = []
for (let code = 32; code <= 126; code++)
  REQUIRED_CHARS.push(String.fromCharCode(code))
// Deutsch extras expected by classic FIGfonts
for (const ch of ['Ä', 'Ö', 'Ü', 'ä', 'ö', 'ü', 'ß']) REQUIRED_CHARS.push(ch)

function listFontFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) out.push(...listFontFiles(full))
    else if (/\.(ttf|otf)$/i.test(name)) out.push(full)
  }
  return out
}

function scoreCrispness(imageData) {
  const data = imageData.data
  let solid = 0
  let mid = 0
  let ink = 0
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 8) continue
    ink++
    if (a >= 200 || a <= 40) solid++
    else mid++
  }
  if (ink === 0) return 0
  return solid / ink - mid / ink
}

function pickPixelSize(font, baseName) {
  if (SIZE_HINTS[baseName]) return SIZE_HINTS[baseName]

  let best = 12
  let bestScore = -Infinity
  for (const size of [5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 24]) {
    const sample = renderCharBitmap(font, 'A', size)
    if (!sample) continue
    const score =
      scoreCrispness(sample.imageData) - Math.abs(sample.height - 12) * 0.02
    if (score > bestScore) {
      bestScore = score
      best = size
    }
  }
  return best
}

function renderCharBitmap(font, char, pixelSize) {
  const glyph = font.charToGlyph(char)
  if (!glyph || (glyph.index === 0 && char !== '\0' && char !== ' ')) {
    // missing glyph — still allocate space for space char etc.
  }

  const scale = pixelSize / font.unitsPerEm
  const ascent = Math.max(1, Math.round(font.ascender * scale))
  const descent = Math.max(0, Math.round(Math.abs(font.descender) * scale))
  const height = ascent + descent

  const adv =
    glyph.advanceWidth != null ? glyph.advanceWidth : font.unitsPerEm * 0.5
  let width = Math.max(1, Math.round(adv * scale))

  // Pad a bit so strokes on the right aren't clipped
  const padX = 1
  const canvasW = width + padX
  const canvas = createCanvas(canvasW, height)
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvasW, height)

  if (char !== ' ') {
    const path = glyph.getPath(0, ascent, pixelSize)
    path.fill = 'black'
    path.draw(ctx)
  }

  const imageData = ctx.getImageData(0, 0, canvasW, height)
  return { imageData, width: canvasW, height, ascent }
}

function bitmapToRows(imageData, width, height) {
  const data = imageData.data
  const rows = []
  let maxX = -1

  for (let y = 0; y < height; y++) {
    let line = ''
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3]
      const on = a >= THRESHOLD
      if (on) maxX = Math.max(maxX, x)
      line += on ? INK : ' '
    }
    rows.push(line)
  }

  // Keep full advance width (including trailing empty cols) for monospace feel,
  // but trim completely empty right padding beyond last ink + 1.
  const keepWidth = Math.max(1, maxX + 2)
  return rows.map((line) => {
    const sliced = line.slice(0, Math.min(line.length, keepWidth))
    // FIGfont: preserve internal spaces as hardblanks so layout keeps glyph width
    return sliced.replace(/ /g, HARDBLANK)
  })
}

function emptyRows(height, width = 1) {
  return Array.from({ length: height }, () => HARDBLANK.repeat(width))
}

function formatFigChar(rows) {
  return rows
    .map((row, index) => {
      const mark = index === rows.length - 1 ? ENDMARK + ENDMARK : ENDMARK
      return `${row}${mark}`
    })
    .join('\n')
}

function convertFont(filePath) {
  const buffer = readFileSync(filePath)
  const font = opentype.parse(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
  )

  const baseName = basename(filePath, extname(filePath)).replace(/ /g, '_')
  const pixelSize = pickPixelSize(font, baseName)

  // Establish height from 'A' (or 'M')
  const probe =
    renderCharBitmap(font, 'A', pixelSize) ||
    renderCharBitmap(font, 'M', pixelSize)
  const height = probe.height
  const baseline = probe.ascent

  const chars = []
  let maxLen = 0

  for (const char of REQUIRED_CHARS) {
    let rows
    try {
      const bmp = renderCharBitmap(font, char, pixelSize)
      rows = bitmapToRows(bmp.imageData, bmp.width, bmp.height)
      // Normalize height
      if (rows.length < height) {
        rows = [...rows, ...emptyRows(height - rows.length)]
      } else if (rows.length > height) {
        rows = rows.slice(0, height)
      }
    } catch {
      rows = emptyRows(height)
    }

    // Space glyph: ensure non-zero width
    if (char === ' ') {
      const w = Math.max(1, Math.round(pixelSize * 0.5))
      rows = emptyRows(height, w)
    }

    maxLen = Math.max(maxLen, ...rows.map((r) => r.length + 2))
    chars.push({ char, rows })
  }

  // Drop rows that are blank across every glyph (top/bottom padding)
  const blankRows = Array.from({ length: height }, (_, y) =>
    chars.every(
      (c) => !c.rows[y] || !/[^\s$]/.test(c.rows[y].replaceAll(HARDBLANK, ' ')),
    ),
  )
  let top = 0
  while (top < height && blankRows[top]) top++
  let bottom = height - 1
  while (bottom > top && blankRows[bottom]) bottom--
  if (top > 0 || bottom < height - 1) {
    for (const c of chars) {
      c.rows = c.rows.slice(top, bottom + 1)
    }
  }
  const finalHeight = bottom - top + 1
  const finalBaseline = Math.max(1, baseline - top)

  const commentLines = [
    `${baseName} — converted from ${basename(filePath)} by ascii-smht ttf-to-flf`,
    `Source designer: GGBotNet (pixel TTF/OTF → FIGfont, full block █)`,
    `Render size: ${pixelSize}px, height: ${finalHeight}, baseline: ${finalBaseline}`,
    `Hardblank: ${HARDBLANK}, ink: ${INK}, no half-blocks`,
  ]

  // old_layout 15 = full width (no smushing); print direction 0; full_layout 0
  const header = `flf2a${HARDBLANK} ${finalHeight} ${finalBaseline} ${maxLen} 15 ${commentLines.length} 0 144 0`

  const body = chars.map((c) => formatFigChar(c.rows)).join('\n')
  const flf = `${header}\n${commentLines.join('\n')}\n${body}\n`

  return { baseName, pixelSize, height: finalHeight, flf }
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  mkdirSync(RAW_DIR, { recursive: true })

  const files = listFontFiles(SOURCE_DIR).filter(
    (f) => !f.includes('LICENSE') && !basename(f).startsWith('.'),
  )

  if (files.length === 0) {
    console.error('No TTF/OTF in', SOURCE_DIR)
    process.exit(1)
  }

  const manifest = []

  for (const file of files) {
    const rel = relative(SOURCE_DIR, file)
    try {
      const { baseName, pixelSize, height, flf } = convertFont(file)
      const outName = `${baseName}.flf`
      writeFileSync(join(OUT_DIR, outName), flf)
      writeFileSync(join(RAW_DIR, outName), flf)
      console.log(`✓ ${rel} → ${outName} (${pixelSize}px, h=${height})`)
      manifest.push({
        id: baseName,
        file: outName,
        source: rel,
        pixelSize,
        height,
      })
    } catch (err) {
      console.error(`✗ ${rel}:`, err.message)
    }
  }

  writeFileSync(
    join(OUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  )
  console.log(`\nDone: ${manifest.length} fonts → ${OUT_DIR}`)
}

main()
