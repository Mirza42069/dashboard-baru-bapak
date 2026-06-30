import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { MeruShell } from './meru-shell'

export function AuthenticatedLayout() {
  return (
    <LayoutProvider>
      <SidebarProvider>
        <SearchProvider>
          <MeruShell />
        </SearchProvider>
      </SidebarProvider>
    </LayoutProvider>
  )
}
