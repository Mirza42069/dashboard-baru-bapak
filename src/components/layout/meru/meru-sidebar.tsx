import { CircleHelp, Settings } from 'lucide-react'
import { MeruNavSection } from './meru-nav-section'
import { MeruSideUtility } from './meru-side-utility'
import { useWorkspaceLinks } from './workspace-links'

export function MeruSidebar() {
  const workspaceLinks = useWorkspaceLinks()
  return (
    <aside className='sticky top-[4.5rem] hidden h-[calc(100svh-5.5rem)] rounded-lg border border-sidebar-border bg-sidebar shadow-sm md:flex md:flex-col'>
      <nav className='flex-1 p-3'>
        <MeruNavSection title='Workspace' items={workspaceLinks} />
      </nav>
      <div className='border-t border-sidebar-border p-3'>
        <MeruSideUtility icon={Settings} label='Settings' />
        <MeruSideUtility icon={CircleHelp} label='Help & support' />
      </div>
    </aside>
  )
}
