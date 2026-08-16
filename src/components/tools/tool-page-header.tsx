import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ToolDefinition } from '@/lib/tools'

export function ToolPageHeader({ tool }: { tool: ToolDefinition }) {
  return (
    <div className="mb-10 space-y-4">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeftIcon className="size-3.5" />
        Přehled nástrojů
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="font-mono text-xl text-muted-foreground"
            >
              {tool.accent}
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {tool.title}
            </h1>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {tool.description}
          </p>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[0.65rem] uppercase tracking-wider"
        >
          {tool.status === 'ready' ? 'hotovo' : 'příprava'}
        </Badge>
      </div>
    </div>
  )
}
