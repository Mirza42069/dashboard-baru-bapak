import { Outlet } from '@tanstack/react-router'
import { FooterNote } from '@/features/meru/components'
import { MeruSidebar } from './meru-sidebar'
import { MeruTopbar } from './meru-topbar'

export function MeruShell() {
  return (
    <div className='w-full min-h-svh bg-background text-[13px] text-foreground antialiased'>
      <MeruTopbar />

      <div className='grid min-h-[calc(100svh-3.5rem)] grid-cols-1 gap-4 md:grid-cols-[244px_1fr] md:p-4 md:pe-0'>
        <MeruSidebar />
        <main className='overflow-x-hidden px-4 py-5 md:px-2 md:pe-6 md:pt-1 lg:pe-8'>
          <div className='mx-auto max-w-7xl'>
            <Outlet />
            <FooterNote />
          </div>
        </main>
      </div>
    </div>
  )
}
