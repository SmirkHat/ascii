import { useDeferredValue, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CUSTOM_FIGLET_FONTS, FIGLET_FONTS } from '@/lib/figlet'
import type { FigletFontName } from '@/lib/figlet'
import { cn } from '@/lib/utils'

type FontOption = {
  label: string
  value: FigletFontName
  group: 'ggbotnet' | 'figlet'
}

const ALL_FONT_OPTIONS: Array<FontOption> = [
  ...CUSTOM_FIGLET_FONTS.map((font) => ({
    label: font,
    value: font,
    group: 'ggbotnet' as const,
  })),
  ...FIGLET_FONTS.filter((font) => !CUSTOM_FIGLET_FONTS.includes(font)).map(
    (font) => ({
      label: font,
      value: font,
      group: 'figlet' as const,
    }),
  ),
]

type FigletFontPickerProps = {
  value: FigletFontName
  onValueChange: (font: FigletFontName) => void
  className?: string
}

export function FigletFontPicker({
  value,
  onValueChange,
  className,
}: FigletFontPickerProps) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [open, setOpen] = useState(false)
  const selected =
    ALL_FONT_OPTIONS.find((option) => option.value === value) ??
    ALL_FONT_OPTIONS[0]

  const filtered = useMemo(() => {
    if (!open) return []

    const needle = deferredQuery.trim().toLowerCase()
    if (!needle) return ALL_FONT_OPTIONS
    return ALL_FONT_OPTIONS.filter((option) =>
      option.label.toLowerCase().includes(needle),
    )
  }, [deferredQuery, open])

  const selectItems = useMemo(() => {
    if (!open) return [selected]
    if (filtered.some((option) => option.value === selected.value)) {
      return filtered
    }
    return [selected, ...filtered]
  }, [filtered, selected])

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">Font</Label>
        <span className="font-mono text-[0.65rem] text-muted-foreground">
          {CUSTOM_FIGLET_FONTS.length} pixel · {FIGLET_FONTS.length} celkem
        </span>
      </div>
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filtrovat (Ithaca, Pixeloid…)"
        className="font-mono"
        aria-label="Filtrovat fonty"
      />
      <Select
        items={selectItems}
        value={selected}
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
        onValueChange={(next) => {
          if (next) onValueChange(next.value)
        }}
        itemToStringValue={(item) => item.value}
      >
        <SelectTrigger className="w-full font-mono">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup className="max-h-72 min-w-[min(100vw-2rem,20rem)]">
          {open ? (
            filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Žádný font neodpovídá.
              </div>
            ) : (
              filtered.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option}
                  className="items-start py-1.5 font-mono"
                >
                  <span className="flex w-full min-w-0 items-center justify-between gap-2">
                    <span className="truncate text-sm">{option.label}</span>
                    {option.group === 'ggbotnet' ? (
                      <span className="shrink-0 text-[0.6rem] text-muted-foreground">
                        pixel
                      </span>
                    ) : null}
                  </span>
                </SelectItem>
              ))
            )
          ) : null}
        </SelectPopup>
      </Select>
    </div>
  )
}
