import { type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

function InputGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex h-9 w-full items-center overflow-hidden rounded-md border bg-background text-sm shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50',
        className
      )}
      {...props}
    />
  )
}

function InputGroupAddon({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-center px-3 text-muted-foreground', className)}
      {...props}
    />
  )
}

function InputGroupInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-full min-w-0 flex-1 bg-transparent px-0 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon, InputGroupInput }
