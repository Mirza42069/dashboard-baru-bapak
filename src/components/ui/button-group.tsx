import { type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

function ButtonGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role='group'
      className={cn(
        'inline-flex items-center rounded-md shadow-xs [&>*:not(:first-child)]:rounded-s-none [&>*:not(:first-child)]:border-s-0 [&>*:not(:last-child)]:rounded-e-none',
        className
      )}
      {...props}
    />
  )
}

export { ButtonGroup }
