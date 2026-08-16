import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { ClipboardPasteIcon, ImageIcon, UploadIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg'

type ImageUploadProps = {
  onFileChange?: (file: File | null) => void
  className?: string
}

function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    case 'image/svg+xml':
      return 'svg'
    default:
      return 'png'
  }
}

function fileFromClipboard(event: ClipboardEvent): File | null {
  const items = event.clipboardData?.items
  if (!items) return null

  for (const item of items) {
    if (item.kind !== 'file' || !item.type.startsWith('image/')) continue
    const blob = item.getAsFile()
    if (!blob) continue
    if (blob.name && blob.name !== 'image.png') return blob
    const ext = extensionForMime(blob.type || 'image/png')
    return new File([blob], `clipboard.${ext}`, {
      type: blob.type || 'image/png',
      lastModified: Date.now(),
    })
  }

  return null
}

export function ImageUpload({ onFileChange, className }: ImageUploadProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)
  const onFileChangeRef = useRef(onFileChange)
  const [fileName, setFileName] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pasteHint, setPasteHint] = useState(false)

  onFileChangeRef.current = onFileChange

  function revokePreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }

  function applyFile(file: File | null) {
    revokePreview()

    if (!file) {
      setPreviewUrl(null)
      setFileName(null)
      if (inputRef.current) inputRef.current.value = ''
      onFileChangeRef.current?.(null)
      return
    }

    const url = URL.createObjectURL(file)
    previewUrlRef.current = url
    setFileName(file.name)
    setPreviewUrl(url)
    onFileChangeRef.current?.(file)
  }

  const applyFileRef = useRef(applyFile)
  applyFileRef.current = applyFile

  function clearFile() {
    applyFile(null)
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    applyFile(event.target.files?.[0] ?? null)
  }

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      const file = fileFromClipboard(event)
      if (!file) return

      // Only hijack paste when clipboard holds an image.
      event.preventDefault()
      applyFileRef.current(file)
      setPasteHint(true)
      window.setTimeout(() => setPasteHint(false), 1600)
    }

    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('paste', onPaste)
      revokePreview()
    }
  }, [])

  return (
    <div className={cn('space-y-3', className)}>
      <label
        htmlFor={inputId}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-4 py-10 text-center transition-colors',
          'hover:border-primary/50 hover:bg-primary/5',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
          pasteHint && 'border-foreground/40 bg-muted/40',
        )}
      >
        <span className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
          {pasteHint ? (
            <ClipboardPasteIcon className="size-4" />
          ) : (
            <UploadIcon className="size-4" />
          )}
        </span>
        <span className="space-y-1">
          <span className="block text-sm font-medium text-foreground">
            {pasteHint ? 'Vloženo ze schránky' : 'Nahrajte obrázek'}
          </span>
          <span className="block text-xs text-muted-foreground">
            PNG, JPG, WebP, GIF nebo SVG — nebo Ctrl+V
          </span>
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={handleChange}
        />
      </label>

      {fileName ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background/80 p-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-4 text-muted-foreground" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs text-foreground">
              {fileName}
            </p>
            <p className="text-xs text-muted-foreground">
              Připraveno k převodu
            </p>
          </div>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            aria-label="Odebrat soubor"
            onClick={clearFile}
          >
            <XIcon />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
