import type { LucideIcon } from 'lucide-react'

export function BuildFlowSideUtility({
  icon: Icon,
  label,
}: {
  icon: LucideIcon
  label: string
}) {
  return (
    <button className='flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'>
      <Icon className='size-4' />
      {label}
    </button>
  )
}
