import { cn } from '@/lib/utils'

type MetricCardProps = {
  label: string
  value: string
  hint?: string
  tone?: 'good' | 'risk' | 'neutral'
}

// Filled, color-coded metric blocks (DESIGN §7.8) — neutral reads as lapis,
// good/risk pick up the earthen status ramp.
const toneCls: Record<NonNullable<MetricCardProps['tone']>, string> = {
  neutral: 'border-[var(--lapis-100)] bg-[var(--lapis-50)]',
  good: 'border-[var(--status-ok-bd)] bg-[var(--status-ok-bg)]',
  risk: 'border-[var(--status-risk-bd)] bg-[var(--status-risk-bg)]',
}
const valueCls: Record<NonNullable<MetricCardProps['tone']>, string> = {
  neutral: 'text-[var(--lapis-700)]',
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
    <div
      className={cn(
        'group rounded-md border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
        toneCls[tone]
      )}
    >
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
