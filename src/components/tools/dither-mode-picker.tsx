import { useId } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export const DITHER_MODES = [
  {
    id: 'none',
    label: 'Bez textury',
    hint: 'Klasické mapování jasu na znaky',
  },
  {
    id: 'bayer',
    label: 'Bayer textura',
    hint: 'Výraznější 4×4 vzor přes znakovou sadu',
  },
  {
    id: 'bayerSoft',
    label: 'Bayer grain',
    hint: 'Jemnější 4×4 vzor přes znakovou sadu',
  },
] as const

export type DitherModeId = (typeof DITHER_MODES)[number]['id']

type DitherOption = {
  label: string
  value: DitherModeId
  hint: string
}

const OPTIONS: Array<DitherOption> = DITHER_MODES.map((mode) => ({
  label: mode.label,
  value: mode.id,
  hint: mode.hint,
}))

type DitherModePickerProps = {
  value?: DitherModeId
  onValueChange?: (value: DitherModeId) => void
  className?: string
}

export function DitherModePicker({
  value = 'none',
  onValueChange,
  className,
}: DitherModePickerProps) {
  const labelId = useId()
  const selected =
    OPTIONS.find((option) => option.value === value) ?? OPTIONS[0]

  return (
    <div className={cn('space-y-2', className)}>
      <Label id={labelId} className="text-xs text-muted-foreground">
        Textura
      </Label>
      <Select
        items={OPTIONS}
        value={selected}
        onValueChange={(next) => {
          if (next) onValueChange?.(next.value)
        }}
        itemToStringValue={(item) => item.value}
      >
        <SelectTrigger aria-labelledby={labelId} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option}>
              <span className="flex flex-col gap-0.5 text-left">
                <span>{option.label}</span>
                <span className="text-[0.7rem] text-muted-foreground">
                  {option.hint}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </div>
  )
}
