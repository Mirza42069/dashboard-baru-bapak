import { cn } from '@/lib/utils'

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm',
        className
      )}
    >
      <div className='flex items-start justify-between gap-3 border-b border-border px-4 py-3'>
        <div>
          <h2 className='font-semibold text-foreground'>{title}</h2>
          {description && (
            <p className='mt-1 text-xs text-muted-foreground'>{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className='p-4'>{children}</div>
    </section>
  )
}
