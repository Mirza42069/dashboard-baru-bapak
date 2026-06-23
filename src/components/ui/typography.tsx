import { type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

function TypographyH1({ className, ...props }: ComponentProps<'h1'>) {
  return (
    <h1
      className={cn('text-3xl font-bold tracking-tight', className)}
      {...props}
    />
  )
}

function TypographyH2({ className, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      className={cn('text-2xl font-semibold tracking-tight', className)}
      {...props}
    />
  )
}

function TypographyP({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn('leading-7 text-muted-foreground', className)}
      {...props}
    />
  )
}

function TypographyMuted({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
}

export { TypographyH1, TypographyH2, TypographyMuted, TypographyP }
