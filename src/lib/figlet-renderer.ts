import figlet from 'figlet'
import {
  isCustomFigletFont,
  loadCustomFigletFontData,
} from '@/lib/custom-figlet-fonts'
import { DEFAULT_FIGLET_OPTIONS } from '@/lib/figlet'
import type { FigletFontName, FigletOptions } from '@/lib/figlet'

/** Lazy loaders for every bundled FIGlet stock font (on-demand chunks). */
const stockFontLoaders = import.meta.glob<{ default: string }>(
  '../../node_modules/figlet/importable-fonts/*.js',
)

const parsedFonts = new Set<string>()

function stockFontModulePath(font: string): string {
  return `../../node_modules/figlet/importable-fonts/${font}.js`
}

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '')
}

/** Keep a Czech glyph when the font defines it; otherwise use its base letter. */
function normalizeFigletInput(text: string, font: FigletFontName): string {
  const parsedFont = figlet.figFonts[font]

  return Array.from(text, (character) => {
    const codePoint = character.codePointAt(0)
    if (codePoint !== undefined && Reflect.has(parsedFont, codePoint)) {
      return character
    }
    return stripDiacritics(character)
  }).join('')
}

async function ensureFigletFont(font: FigletFontName): Promise<void> {
  if (parsedFonts.has(font)) return

  const alreadyLoaded = figlet.loadedFonts().includes(font)
  if (alreadyLoaded) {
    parsedFonts.add(font)
    return
  }

  if (isCustomFigletFont(font)) {
    const data = await loadCustomFigletFontData(font)
    figlet.parseFont(font, data)
    parsedFonts.add(font)
    return
  }

  const loader = stockFontLoaders[stockFontModulePath(font)]
  const mod = await loader()
  figlet.parseFont(font, mod.default)
  parsedFonts.add(font)
}

export async function renderFiglet(
  text: string,
  options: Partial<FigletOptions> = {},
): Promise<string> {
  const font = options.font ?? DEFAULT_FIGLET_OPTIONS.font
  const horizontalLayout =
    options.horizontalLayout ?? DEFAULT_FIGLET_OPTIONS.horizontalLayout

  await ensureFigletFont(font)
  const input = text.length > 0 ? normalizeFigletInput(text, font) : ' '

  return figlet.text(input, {
    font,
    horizontalLayout,
  })
}
