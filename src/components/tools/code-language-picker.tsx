import { useId } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '@/components/ui/select'
import { CODE_TOKEN_POOLS } from '@/lib/code-tokens'
import { cn } from '@/lib/utils'

export { CODE_TOKEN_POOLS }
export type CodeTokenPoolId = (typeof CODE_TOKEN_POOLS)[number]['id']

const OPTIONS = CODE_TOKEN_POOLS.map((p) => ({
  label: p.label,
  value: p.id,
}))

type CodeLanguagePickerProps = {
  value?: CodeTokenPoolId
  onValueChange?: (value: CodeTokenPoolId) => void
  disabled?: boolean
  className?: string
}

export function CodeLanguagePicker({
  value = 'python',
  onValueChange,
  disabled = true,
  className,
}: CodeLanguagePickerProps) {
  const labelId = useId()
  const selected = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0]

  return (
    <div className={cn('space-y-2', className)}>
      <Label id={labelId} className="text-xs text-muted-foreground">
        Jazyk / syntaxe
      </Label>
      <Select
        items={OPTIONS}
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
          {OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt}>
              <span className="font-mono text-sm">{opt.label}</span>
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </div>
  )
}
