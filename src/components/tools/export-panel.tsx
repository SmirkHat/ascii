import { CopyIcon, DownloadIcon, FileCodeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ExportPanelProps = {
  disabled?: boolean
  className?: string
  onCopy?: () => void
  onDownload?: () => void
  onDownloadSvg?: () => void
}

export function ExportPanel({
  disabled = true,
  className,
  onCopy,
  onDownload,
  onDownloadSvg,
}: ExportPanelProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 shadow-sm',
        className,
      )}
    >
      <p className="mr-auto font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
        Export
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={onCopy}
      >
        <CopyIcon />
        Kopírovat
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={onDownload}
      >
        <DownloadIcon />
        TXT
      </Button>
      {onDownloadSvg ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={onDownloadSvg}
        >
          <FileCodeIcon />
          SVG
        </Button>
      ) : null}
    </div>
  )
}
