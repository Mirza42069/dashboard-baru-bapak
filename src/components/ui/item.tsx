import { type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

function Item({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-start gap-3', className)} {...props} />
}

function ItemMedia({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('shrink-0', className)} {...props} />
}

function ItemContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('min-w-0 flex-1', className)} {...props} />
}

function ItemTitle({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('font-medium', className)} {...props} />
}

function ItemDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

function ItemActions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('ms-auto flex items-center gap-2', className)}
      {...props}
    />
  )
}

export { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle }
