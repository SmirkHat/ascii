import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import type * as React from 'react'
import type { VariantProps } from 'class-variance-authority'

import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent text-sm font-medium transition-[color,background-color,border-color,filter] duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:brightness-110 active:brightness-95',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:brightness-110 active:brightness-95',
        'destructive-outline':
          'border-destructive/40 bg-background text-destructive hover:border-destructive hover:bg-destructive/5',
        outline:
          'border border-input bg-background shadow-sm hover:border-primary/50 hover:bg-primary/5 hover:text-primary',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-muted hover:text-foreground',
        ghost: 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
        xs: 'h-7 rounded-md px-2 text-xs',
        xl: 'h-11 rounded-md px-8 text-lg',
        'icon-xs': 'h-7 w-7 rounded-md',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-10 w-10',
        'icon-xl': 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  loading = false,
  disabled: disabledProp,
  type,
  ...props
}: ButtonProps): React.ReactElement {
  const Comp = asChild ? Slot : 'button'
  const disabled = Boolean(loading || disabledProp)
  const content = loading ? (
    <>
      {children}
      <Spinner
        className="pointer-events-none absolute"
        data-slot="button-loading-indicator"
      />
    </>
  ) : (
    children
  )

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      aria-disabled={loading || undefined}
      disabled={asChild ? undefined : disabled}
      type={asChild ? undefined : (type ?? 'button')}
      {...props}
    >
      {content}
    </Comp>
  )
}
