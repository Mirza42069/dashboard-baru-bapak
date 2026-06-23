import { type ComponentProps } from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

function Pagination({ className, ...props }: ComponentProps<'nav'>) {
  return (
    <nav
      aria-label='pagination'
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: ComponentProps<'ul'>) {
  return (
    <ul
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  )
}

function PaginationItem(props: ComponentProps<'li'>) {
  return <li {...props} />
}

function PaginationLink({
  className,
  isActive,
  ...props
}: ComponentProps<'a'> & { isActive?: boolean }) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-md border text-sm hover:bg-accent',
        isActive && 'bg-accent font-medium',
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink className={cn('gap-1 px-2.5', className)} {...props}>
      <ChevronLeft className='size-4' />
      <span>Previous</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  ...props
}: ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink className={cn('gap-1 px-2.5', className)} {...props}>
      <span>Next</span>
      <ChevronRight className='size-4' />
    </PaginationLink>
  )
}

function PaginationEllipsis({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      className={cn('flex size-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontal className='size-4' />
      <span className='sr-only'>More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
