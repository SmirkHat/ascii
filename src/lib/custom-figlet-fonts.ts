/**
 * Custom GGBotNet FIGfonts (converted from pixel TTF/OTF).
 * Loaded via Vite ?raw imports.
 */

import { REMOVED_FIGLET_FONTS } from '@/lib/figlet-exclusions'

const customFontModules = import.meta.glob('../fonts/flf/*.flf', {
  query: '?raw',
  import: 'default',
  eager: false,
}) as Record<string, () => Promise<string>>

function fontIdFromPath(path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.flf$/i, '')
}

export const CUSTOM_FIGLET_FONTS = Object.keys(customFontModules)
  .map(fontIdFromPath)
  .filter((font) => !REMOVED_FIGLET_FONTS.has(font))
  .sort((a, b) => a.localeCompare(b, 'en')) as ReadonlyArray<string>

export type CustomFigletFontName = (typeof CUSTOM_FIGLET_FONTS)[number]

export function isCustomFigletFont(name: string): boolean {
  return CUSTOM_FIGLET_FONTS.includes(name)
}

export async function loadCustomFigletFontData(name: string): Promise<string> {
  if (REMOVED_FIGLET_FONTS.has(name)) {
    throw new Error(`FIGlet font „${name}“ je vyřazený z katalogu.`)
  }

  const entry = Object.entries(customFontModules).find(
    ([path]) => fontIdFromPath(path) === name,
  )
  if (!entry) {
    throw new Error(`Vlastní FIGlet font „${name}“ nebyl nalezen.`)
  }
  return entry[1]()
}
