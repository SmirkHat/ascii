import { useId } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/** Charsets ordered light → dark (space / sparse first). */
export const CHARACTER_SETS = [
  {
    id: 'standard',
    label: 'Standard',
    value: ' .:-=+*#%@',
  },
  {
    id: 'blocks',
    label: 'Bloky',
    value: ' ░▒▓█',
  },
  {
    id: 'blocksSoft',
    label: 'Bloky soft',
    value: ' ·▫▪░▒▓█',
  },
  {
    id: 'dots',
    label: 'Tečky',
    value: ' ·•●',
  },
  {
    id: 'dotsDense',
    label: 'Tečky husté',
    value: ' .·:;!|*+xoXO0@',
  },
  {
    id: 'simple',
    label: 'Jednoduchá',
    value: ' .-+*#',
  },
  {
    id: 'minimal',
    label: 'Minimální',
    value: ' ░█',
  },
  {
    id: 'geometric',
    label: 'Geometrie',
    value: ' ·▫▪◆■█',
  },
  {
    id: 'triangles',
    label: 'Trojúhelníky',
    value: ' ·▴▵▲█',
  },
  {
    id: 'box',
    label: 'Box drawing',
    value: ' ─│┌┐└┘├┤┬┴┼╬█',
  },
  {
    id: 'horizontal',
    label: 'Horizontální',
    value: ' ▏▎▍▌▋▊▉█',
  },
  {
    id: 'vertical',
    label: 'Vertikální',
    value: ' ▁▂▃▄▅▆▇█',
  },
  {
    id: 'pipes',
    label: 'Trubky',
    value: ' |/\\_+#█',
  },
  {
    id: 'hash',
    label: 'Hash',
    value: ' .:~-+*#%@█',
  },
  {
    id: 'stars',
    label: 'Hvězdy',
    value: ' .·*⋆✦★',
  },
  {
    id: 'binary',
    label: 'Binary',
    value: ' 01',
  },
  {
    id: 'matrix',
    label: 'Matrix',
    value: ' .:-=*#%@█',
  },
  {
    id: 'alphabet',
    label: 'A–Z',
    value: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  },
  {
    id: 'hex',
    label: 'Hex',
    value: ' 0123456789ABCDEF',
  },
  {
    id: 'braille',
    label: 'Braille',
    value: ' ⠁⠂⠄⠈⠐⠠⡀⢀⣿',
  },
  {
    id: 'brailleDense',
    label: 'Braille husté',
    value: ' ⠁⠃⠇⠏⠟⠿⡿⣿',
  },
  {
    id: 'asciiShort',
    label: 'ASCII short',
    value: ' .,:;i1tfLCG08@',
  },
  {
    id: 'dense',
    label: 'Hustá',
    value:
      ' .\'"`^-,:;Il!i><~+_-=?[]{}1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  },
  {
    id: 'retro',
    label: 'Retro CRT',
    value: ' ·∙•○●░▒▓█',
  },
  {
    id: 'sketch',
    label: 'Skica',
    value: ' ,.;:~-=+*xX#',
  },
  {
    id: 'codePython',
    label: 'Python',
    value: ' ░.:_-=+|/*\\%#&~^<>()[]{}`!?;\'"@',
  },
  {
    id: 'codeCSharp',
    label: 'C#',
    value: ' ░.:_;=+|/*\\%#&<>()[]{}`!?$\'"@',
  },
  {
    id: 'codeCpp',
    label: 'C++',
    value: ' ░.:_;*&<>=+|/\\%#()[]{}`!?$\'"@',
  },
  {
    id: 'codeHtml',
    label: 'HTML',
    value: ' ░.:_-=/"<>+|\\*#%&;()[]{}`!?$\'@',
  },
  {
    id: 'codeJs',
    label: 'JavaScript',
    value: ' ░.:_;=+|/*\\&%#$<>()[]{}`!?\'"@',
  },
  {
    id: 'codeGo',
    label: 'Go',
    value: ' ░.:_-=+*|/\\&%#<>()[]{}`!?;\'"@',
  },
  {
    id: 'linux',
    label: 'Linux',
    value: ' ░.:_/~+-=$#%|*&\\<>()[]{}`!?;\'"@',
  },
  {
    id: 'bash',
    label: 'Bash',
    value: ' ░.:_-/|>&<+*=#%$;\\()[]{}`!?\'"@',
  },
  {
    id: 'commands',
    label: 'Příkazy',
    value: ' ░.:_/~$#>-+=|*&\\%/;()[]{}`!?\'"@',
  },
] as const

export type CharacterSetId = (typeof CHARACTER_SETS)[number]['id']

type CharacterSetOption = {
  label: string
  value: CharacterSetId
  charset: string
}

const CHARACTER_SET_OPTIONS: Array<CharacterSetOption> = CHARACTER_SETS.map(
  (set) => ({
    label: set.label,
    value: set.id,
    charset: set.value,
  }),
)

type CharacterSetPickerProps = {
  value?: CharacterSetId
  onValueChange?: (value: CharacterSetId) => void
  disabled?: boolean
  className?: string
}

export function CharacterSetPicker({
  value = 'standard',
  onValueChange,
  disabled = true,
  className,
}: CharacterSetPickerProps) {
  const labelId = useId()
  const selected =
    CHARACTER_SET_OPTIONS.find((set) => set.value === value) ??
    CHARACTER_SET_OPTIONS[0]

  return (
    <div className={cn('space-y-2', className)}>
      <Label id={labelId} className="text-xs text-muted-foreground">
        Textura / znaková sada
      </Label>
      <Select
        items={CHARACTER_SET_OPTIONS}
        value={selected}
        onValueChange={(next) => {
          if (next) onValueChange?.(next.value)
        }}
        disabled={disabled}
        itemToStringValue={(item) => item.value}
      >
        <SelectTrigger aria-labelledby={labelId} className="w-full font-mono">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup className="max-h-72">
          {CHARACTER_SET_OPTIONS.map((set) => (
            <SelectItem key={set.value} value={set}>
              <span className="flex w-full items-center justify-between gap-3">
                <span>{set.label}</span>
                <span className="max-w-[9rem] truncate font-mono text-xs text-muted-foreground">
                  {set.charset.trimStart().slice(0, 12)}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
      <p className="break-all font-mono text-[0.7rem] leading-relaxed text-muted-foreground">
        {selected.charset}
      </p>
    </div>
  )
}
