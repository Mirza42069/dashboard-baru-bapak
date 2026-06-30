import { cn } from '@/lib/utils'

type Tone = 'good' | 'risk' | 'danger' | 'neutral' | 'muted'

// MERU §3/§11: status color is never the only signal — every tone pairs with a
// shape glyph and the text label (children), so the UI reads in greyscale too.
const glyph: Record<Tone, string> = {
  good: '●',
  risk: '◆',
  danger: '▼',
  neutral: '–',
  muted: '–',
}

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: Tone
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
        tone === 'good' &&
          'border-[var(--status-ok-bd)] bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)]',
        tone === 'risk' &&
          'border-[var(--status-risk-bd)] bg-[var(--status-risk-bg)] text-[var(--status-risk-fg)]',
        tone === 'danger' &&
          'border-[var(--status-behind-bd)] bg-[var(--status-behind-bg)] text-[var(--status-behind-fg)]',
        tone === 'neutral' &&
          'border-[var(--status-none-bd)] bg-[var(--status-none-bg)] text-[var(--status-none-fg)]',
        tone === 'muted' &&
          'border-dashed border-border bg-card text-muted-foreground'
      )}
    >
      <span aria-hidden className='text-[0.85em] leading-none'>
        {glyph[tone]}
      </span>
      {children}
    </span>
  )
}
