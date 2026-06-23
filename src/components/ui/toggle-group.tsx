import { type ComponentProps } from 'react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

function ToggleGroup({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      className={cn('flex items-center gap-1', className)}
      {...props}
    />
  )
}

function ToggleGroupItem({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm hover:bg-accent data-[state=on]:bg-accent',
        className
      )}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
