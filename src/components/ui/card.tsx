'use client'

import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import type React from 'react'

import { cn } from '@/lib/utils'

function Primitive({
  className,
  render,
  dataSlot,
  ...props
}: useRender.ComponentProps<'div'> & { dataSlot: string }): React.ReactElement {
  const defaultProps = {
    className,
    'data-slot': dataSlot,
  }

  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(defaultProps, props),
    render,
  })
}

export function Card({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return (
    <Primitive
      dataSlot="card"
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className,
      )}
      render={render}
      {...props}
    />
  )
}

export function CardFrame({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return (
    <Primitive
      dataSlot="card-frame"
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className,
      )}
      render={render}
      {...props}
    />
  )
}

export function CardFrameHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return (
    <Primitive
      dataSlot="card-frame-header"
      className={cn('flex flex-col gap-1.5 p-6', className)}
      render={render}
      {...props}
    />
  )
}

export function CardFrameTitle({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return (
    <Primitive
      dataSlot="card-frame-title"
      className={cn('font-semibold leading-none tracking-tight', className)}
      render={render}
      {...props}
    />
  )
}

export function CardFrameDescription({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return (
    <Primitive
      dataSlot="card-frame-description"
      className={cn('text-sm text-muted-foreground', className)}
      render={render}
      {...props}
    />
  )
}

export function CardFrameAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return (
    <Primitive
      dataSlot="card-frame-action"
      className={cn('inline-flex self-center justify-self-end', className)}
      render={render}
      {...props}
    />
  )
}

export function CardFrameFooter({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return (
    <Primitive
      dataSlot="card-frame-footer"
      className={cn('px-6 py-4', className)}
      render={render}
      {...props}
    />
  )
}

export function CardHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return (
    <Primitive
      dataSlot="card-header"
      className={cn('flex flex-col gap-1.5 p-6', className)}
      render={render}
      {...props}
    />
  )
}

export function CardTitle({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return (
    <Primitive
      dataSlot="card-title"
      className={cn('font-semibold leading-none tracking-tight', className)}
      render={render}
      {...props}
    />
  )
}

export function CardDescription({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return (
    <Primitive
      dataSlot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      render={render}
      {...props}
    />
  )
}

export function CardAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return (
    <Primitive
      dataSlot="card-action"
      className={cn('inline-flex self-start justify-self-end', className)}
      render={render}
      {...props}
    />
  )
}

export function CardPanel({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return (
    <Primitive
      dataSlot="card-panel"
      className={cn('flex-1 p-6', className)}
      render={render}
      {...props}
    />
  )
}

export function CardFooter({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>): React.ReactElement {
  return (
    <Primitive
      dataSlot="card-footer"
      className={cn('flex items-center p-6', className)}
      render={render}
      {...props}
    />
  )
}

export { CardPanel as CardContent }
