import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { BuildFlowShell } from './buildflow-shell'

export function AuthenticatedLayout() {
  return (
    <LayoutProvider>
      <SidebarProvider>
        <SearchProvider>
          <BuildFlowShell />
        </SearchProvider>
      </SidebarProvider>
    </LayoutProvider>
  )
}
