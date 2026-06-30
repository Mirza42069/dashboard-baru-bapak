import { Link } from '@tanstack/react-router'
import type { WorkspaceLink } from './workspace-links'

export function MeruNavSection({
  items,
  title,
}: {
  title: string
  items: WorkspaceLink[]
}) {
  return (
    <div>
      <div className='mb-2 px-2 text-[10px] font-semibold tracking-[0.18em] text-sidebar-foreground/60 uppercase'>
        {title}
      </div>
      <div className='space-y-1'>
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === '/' }}
            activeProps={{
              className:
                'bg-[var(--sidebar-accent)] font-bold text-[var(--sidebar-accent-foreground)] shadow-[inset_3px_0_0_var(--sidebar-accent-foreground)]',
            }}
            className='flex items-center gap-3 rounded-md px-3 py-2.5 font-semibold text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          >
            <item.icon className='size-4' />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
