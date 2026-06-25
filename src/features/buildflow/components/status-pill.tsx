import { cn } from '@/lib/utils'

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'good' | 'risk' | 'danger' | 'neutral' | 'muted'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium',
        tone === 'good' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        tone === 'risk' && 'border-amber-200 bg-amber-50 text-amber-700',
        tone === 'danger' && 'border-rose-200 bg-rose-50 text-rose-700',
        tone === 'neutral' && 'border-border bg-muted text-muted-foreground',
        tone === 'muted' &&
          'border-dashed border-border bg-card text-muted-foreground'
      )}
    >
      {children}
    </span>
  )
}
