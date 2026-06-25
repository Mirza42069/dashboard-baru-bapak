import { Grid2X2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BuildFlowBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2',
        compact ? '' : 'border-b border-border p-4'
      )}
    >
      <div className='grid size-8 place-items-center rounded-sm border border-border bg-card shadow-xs'>
        <Grid2X2 className='size-4 text-foreground' />
      </div>
      <div className='font-semibold tracking-tight text-foreground'>
        BUILDFLOW
      </div>
    </div>
  )
}
