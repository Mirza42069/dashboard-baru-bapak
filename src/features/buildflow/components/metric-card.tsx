import { cn } from '@/lib/utils'

type MetricCardProps = {
  label: string
  value: string
  hint: string
  tone?: 'good' | 'risk' | 'neutral'
}

export function MetricCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: MetricCardProps) {
  return (
    <div className='group rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'>
      <div className='flex items-center justify-between gap-3'>
        <div className='text-[10px] tracking-[0.16em] text-muted-foreground uppercase'>
          {label}
        </div>
        <span
          className={cn(
            'size-2 rounded-full',
            tone === 'good' && 'bg-emerald-500',
            tone === 'risk' && 'bg-amber-500',
            tone === 'neutral' && 'bg-muted-foreground/35'
          )}
        />
      </div>
      <div className='mt-3 text-2xl font-semibold tracking-tight text-card-foreground'>
        {value}
      </div>
      <div className='mt-1 text-xs text-muted-foreground'>{hint}</div>
    </div>
  )
}
