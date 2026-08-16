import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { tools } from '@/lib/tools'
import type { ToolDefinition } from '@/lib/tools'
import { cn } from '@/lib/utils'

function ToolTile({ tool }: { tool: ToolDefinition }) {
  return (
    <Link
      to={tool.href}
      className={cn(
        'group relative flex flex-col gap-3 rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-[border-color,background-color,transform] duration-150',
        'hover:border-primary/50 hover:bg-primary/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className="font-mono text-2xl leading-none text-primary transition-colors group-hover:text-primary"
        >
          {tool.accent}
        </span>
        <Badge
          variant="outline"
          className="font-mono text-[0.65rem] uppercase tracking-wider"
        >
          {tool.status === 'ready' ? 'hotovo' : 'příprava'}
        </Badge>
      </div>
      <div className="space-y-1.5">
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">
          {tool.title}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {tool.description}
        </p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-primary transition-colors">
        Otevřít
        <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

export function ToolGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <ToolTile key={tool.id} tool={tool} />
      ))}
    </div>
  )
}
