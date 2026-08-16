import {
  CUSTOM_FIGLET_FONTS,
  isCustomFigletFont,
} from '@/lib/custom-figlet-fonts'
import {
  DEFAULT_FIGLET_FONT,
  FIGLET_FONTS as STOCK_FIGLET_FONTS,
} from '@/lib/figlet-fonts'
import type { FigletFontName as StockFigletFontName } from '@/lib/figlet-fonts'
import { REMOVED_FIGLET_FONTS } from '@/lib/figlet-exclusions'

export type FigletHorizontalLayout =
  'default' | 'full' | 'fitted' | 'controlled smushing' | 'universal smushing'

export type FigletFontName = StockFigletFontName | (string & {})

export type FigletOptions = {
  font: FigletFontName
  horizontalLayout: FigletHorizontalLayout
}

export const DEFAULT_FIGLET_OPTIONS: FigletOptions = {
  font: 'PublicPixel',
  horizontalLayout: 'full',
}

/** Stock FIGlet fonts + GGBotNet conversions (custom first). */
export const FIGLET_FONTS: ReadonlyArray<string> = [
  ...CUSTOM_FIGLET_FONTS,
  ...STOCK_FIGLET_FONTS.filter((font) => !REMOVED_FIGLET_FONTS.has(font)),
]

export { DEFAULT_FIGLET_FONT, CUSTOM_FIGLET_FONTS, isCustomFigletFont }

type FigletRenderer = {
  renderFiglet: (
    text: string,
    options?: Partial<FigletOptions>,
  ) => Promise<string>
}

let rendererPromise: Promise<FigletRenderer> | null = null

function loadFigletRenderer() {
  return (rendererPromise ??= import('@/lib/figlet-renderer'))
}

/** Start loading the renderer after the lightweight tool UI is visible. */
export function preloadFigletRenderer(): void {
  void loadFigletRenderer()
}

export async function renderFiglet(
  text: string,
  options: Partial<FigletOptions> = {},
): Promise<string> {
  const { renderFiglet: render } = await loadFigletRenderer()
  return render(text, options)
}

export function isFigletFont(value: string): boolean {
  return FIGLET_FONTS.includes(value)
}

export function listFigletFonts(): ReadonlyArray<string> {
  return FIGLET_FONTS
}

export function listCustomFigletFonts(): ReadonlyArray<string> {
  return CUSTOM_FIGLET_FONTS
}
