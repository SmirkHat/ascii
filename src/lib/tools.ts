export type ToolStatus = 'ready' | 'scaffold'

export type ToolDefinition = {
  id: string
  title: string
  description: string
  href:
    | '/image-to-ascii'
    | '/ai-ascii'
    | '/text-to-banner'
    | '/braille'
    | '/editor'
    | '/gallery'
  status: ToolStatus
  accent: string
}

export const tools: Array<ToolDefinition> = [
  {
    id: 'image-to-ascii',
    title: 'Obrázek → ASCII',
    description:
      'Nahrajte PNG, JPG, WebP nebo SVG a převeďte ho na textovou mřížku znaků.',
    href: '/image-to-ascii',
    status: 'ready',
    accent: '░',
  },
  {
    id: 'ai-ascii',
    title: 'AI → ASCII',
    description:
      'Prompt → Flux Schnell → ASCII. Levný image gen přes Cloudflare Worker.',
    href: '/ai-ascii',
    status: 'ready',
    accent: '✦',
  },
  {
    id: 'text-to-banner',
    title: 'Text → banner',
    description:
      'FIGlet textový generátor se všemi vestavěnými fonty — náhled, kopírování a export.',
    href: '/text-to-banner',
    status: 'ready',
    accent: '█',
  },
  {
    id: 'braille',
    title: 'Braille art',
    description:
      'Hustší ASCII přes braille znaky — ideální pro detaily a nízký kontrast.',
    href: '/braille',
    status: 'scaffold',
    accent: '⠿',
  },
  {
    id: 'editor',
    title: 'Editor',
    description:
      'Ruční úpravy ASCII výstupu, výběr znakové sady a rychlý export.',
    href: '/editor',
    status: 'scaffold',
    accent: '│',
  },
  {
    id: 'gallery',
    title: 'Galerie',
    description:
      'Prohlížení a správa uložených ASCII skladeb z jednotlivých nástrojů.',
    href: '/gallery',
    status: 'scaffold',
    accent: '▒',
  },
]

export function getToolByHref(href: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.href === href)
}
