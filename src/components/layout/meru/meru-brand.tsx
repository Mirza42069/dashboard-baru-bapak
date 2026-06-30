import { Logo } from '@/assets/logo'
import { cn } from '@/lib/utils'

export function MeruBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5',
        compact ? '' : 'border-b border-border p-4'
      )}
    >
      <Logo className='size-6 text-[var(--gold-500)]' />
      <span className='text-[15px] font-semibold tracking-tight text-foreground'>
        MERU
      </span>
    </div>
  )
}
