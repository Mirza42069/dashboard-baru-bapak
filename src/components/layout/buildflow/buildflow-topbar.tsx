import { Bell, ChevronDown, Menu, Search } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { BuildFlowBrand } from './buildflow-brand'
import { BuildFlowNavSection } from './buildflow-nav-section'
import { TopbarThemeButton } from './topbar-theme-button'
import { workspaceLinks } from './workspace-links'

export function BuildFlowTopbar() {
  return (
    <header className='sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background/95 px-3 backdrop-blur md:px-4'>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            className='me-2 size-8 rounded-md bg-card md:hidden'
          >
            <Menu className='size-4' />
          </Button>
        </SheetTrigger>
        <SheetContent side='left' className='w-72 bg-background p-0'>
          <BuildFlowBrand />
          <div className='p-3'>
            <BuildFlowNavSection title='Workspace' items={workspaceLinks} />
          </div>
        </SheetContent>
      </Sheet>

      <div className='hidden min-w-56 md:block'>
        <BuildFlowBrand compact />
      </div>

      <div className='ms-auto flex items-center gap-2 md:gap-3'>
        <Button
          variant='outline'
          className='hidden h-9 gap-2 rounded-md border-border bg-card px-3 font-normal shadow-xs lg:flex'
        >
          <span className='size-4 rounded bg-primary/20 ring-1 ring-primary/25' />
          Current workspace
          <ChevronDown className='size-3' />
        </Button>
        <div className='relative hidden sm:block'>
          <Search className='absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
          <Input
            className='h-9 w-52 rounded-sm border-border bg-card ps-9 text-xs shadow-xs xl:w-64'
            placeholder='Search projects, BoQ, people...'
          />
        </div>
        <Button
          variant='outline'
          size='icon'
          className='size-9 rounded-md border-border bg-card shadow-xs'
        >
          <Bell className='size-4' />
        </Button>
        <TopbarThemeButton />
        <Avatar className='size-9 border border-border bg-muted'>
          <AvatarFallback className='text-xs font-medium'>CM</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
