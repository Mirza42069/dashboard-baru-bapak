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
        'rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm',
        className
      )}
    >
      <div className='mb-4 flex items-start justify-between gap-3'>
        <div>
          <h2 className='font-semibold text-card-foreground'>{title}</h2>
          {description && (
            <p className='mt-1 text-xs text-muted-foreground'>{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
