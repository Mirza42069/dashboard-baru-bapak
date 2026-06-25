import { CircleHelp, Settings } from 'lucide-react'
import { BuildFlowNavSection } from './buildflow-nav-section'
import { BuildFlowSideUtility } from './buildflow-side-utility'
import { workspaceLinks } from './workspace-links'

export function BuildFlowSidebar() {
  return (
    <aside className='sticky top-[4.5rem] hidden h-[calc(100svh-5.5rem)] rounded-lg border border-sidebar-border bg-sidebar shadow-sm md:flex md:flex-col'>
      <nav className='flex-1 p-3'>
        <BuildFlowNavSection title='Workspace' items={workspaceLinks} />
      </nav>
      <div className='border-t border-sidebar-border p-3'>
        <BuildFlowSideUtility icon={Settings} label='Settings' />
        <BuildFlowSideUtility icon={CircleHelp} label='Help & support' />
      </div>
    </aside>
  )
}
