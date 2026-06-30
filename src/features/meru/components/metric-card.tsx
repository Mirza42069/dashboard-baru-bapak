import { cn } from '@/lib/utils'

type Tone = 'good' | 'risk' | 'neutral'
type MetricCardProps = {
  label: string
  value: string
  hint?: string
  tone?: Tone
  plain?: boolean
}

const valueCls: Record<Tone, string> = {
  neutral: 'text-foreground',
  good: 'text-[var(--status-ok-fg)]',
  risk: 'text-[var(--status-risk-fg)]',
}

export function MetricCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: MetricCardProps) {
  return (
    <div className='group rounded-md border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'>
      <div className='text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase'>
        {label}
      </div>
      <div
        className={cn(
          'mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums',
          valueCls[tone]
        )}
      >
        {value}
      </div>
      {hint && <div className='mt-1 text-xs text-muted-foreground'>{hint}</div>}
    </div>
  )
}
