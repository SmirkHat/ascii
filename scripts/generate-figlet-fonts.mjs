import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const fontsDir = join(root, 'node_modules/figlet/importable-fonts')

if (!existsSync(fontsDir)) {
  // Fallback if package layout changes
  const figletEntry = require.resolve('figlet')
  const alt = join(dirname(figletEntry), '../importable-fonts')
  if (!existsSync(alt)) {
    throw new Error(`FIGlet fonts not found at ${fontsDir}`)
  }
}

const resolvedFontsDir = existsSync(fontsDir)
  ? fontsDir
  : join(dirname(require.resolve('figlet')), '../importable-fonts')

const outFile = join(root, 'src/lib/figlet-fonts.ts')

const fonts = readdirSync(resolvedFontsDir)
  .filter((name) => name.endsWith('.js'))
  .map((name) => basename(name, '.js'))
  .sort((a, b) => a.localeCompare(b, 'en'))

const content = `/** Auto-generated from figlet/importable-fonts — do not edit by hand.
 *  Regenerate: npm run generate-figlet-fonts
 */
export const FIGLET_FONTS = ${JSON.stringify(fonts, null, 2)} as const

export type FigletFontName = (typeof FIGLET_FONTS)[number]

export const DEFAULT_FIGLET_FONT: FigletFontName = (
  FIGLET_FONTS as ReadonlyArray<string>
).includes('Standard')
  ? ('Standard' as FigletFontName)
  : FIGLET_FONTS[0]
`

writeFileSync(outFile, content)
console.log(`Wrote ${fonts.length} fonts → ${outFile}`)
