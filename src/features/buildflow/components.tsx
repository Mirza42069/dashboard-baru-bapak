import { Link, Outlet, useLocation } from '@tanstack/react-router'
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Gauge,
  Grid2X2,
  Layers3,
  Menu,
  Moon,
  Search,
  Settings,
  SquareMenu,
  Sun,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

type MetricCardProps = {
  label: string
  value: string
  hint: string
  tone?: 'good' | 'risk' | 'neutral'
}

const workspaceLinks = [
  { label: 'Dashboard', to: '/', icon: Gauge },
  { label: 'Projects', to: '/projects', icon: Grid2X2 },
  { label: 'Team & organisation', to: '/team', icon: Users },
]

const platformLinks = [
  { label: 'Tenants', to: '/tenants', icon: SquareMenu },
  { label: 'Subscriptions', to: '/subscriptions', icon: Layers3 },
]

export function BuildFlowShell() {
  const location = useLocation()
  const isPlatform = ['/tenants', '/subscriptions'].some((path) =>
    location.pathname.startsWith(path)
  )
  const links = isPlatform ? platformLinks : workspaceLinks

  return (
    <div className='min-h-svh bg-background text-[13px] text-foreground antialiased'>
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
            <BrandBlock />
            <div className='p-3'>
              <NavSection
                title={isPlatform ? 'Platform' : 'Workspace'}
                items={links}
              />
            </div>
          </SheetContent>
        </Sheet>

        <div className='hidden min-w-56 md:block'>
          <BrandBlock compact />
        </div>

        <div className='flex rounded-md border border-border bg-muted p-1 shadow-inner'>
          <ModeLink active={!isPlatform} to='/' label='Tenant workspace' />
          <ModeLink active={isPlatform} to='/tenants' label='Platform admin' />
        </div>

        <div className='ms-auto flex items-center gap-2 md:gap-3'>
          {!isPlatform && (
            <Button
              variant='outline'
              className='hidden h-9 gap-2 rounded-md border-border bg-card px-3 font-normal shadow-xs lg:flex'
            >
              <span className='size-4 rounded bg-primary/20 ring-1 ring-primary/25' />
              Current workspace
              <ChevronDown className='size-3' />
            </Button>
          )}
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

      <div className='grid min-h-[calc(100svh-3.5rem)] grid-cols-1 gap-4 md:grid-cols-[244px_1fr] md:p-4 md:pe-0'>
        <aside className='sticky top-[4.5rem] hidden h-[calc(100svh-5.5rem)] rounded-lg border border-sidebar-border bg-sidebar shadow-sm md:flex md:flex-col'>
          <nav className='flex-1 p-3'>
            <NavSection
              title={isPlatform ? 'Platform' : 'Workspace'}
              items={links}
            />
          </nav>
          <div className='border-t border-sidebar-border p-3'>
            <SideUtility icon={Settings} label='Settings' />
            <SideUtility icon={CircleHelp} label='Help & support' />
          </div>
        </aside>
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

function TopbarThemeButton() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      type='button'
      variant='outline'
      size='icon'
      className='size-9 rounded-md border-border bg-card shadow-xs'
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun className='size-4' /> : <Moon className='size-4' />}
    </Button>
  )
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
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

function ModeLink({
  active,
  to,
  label,
}: {
  active: boolean
  to: string
  label: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'rounded-sm px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground md:px-4',
        active && 'bg-card text-foreground shadow-sm'
      )}
    >
      {label}
    </Link>
  )
}

function NavSection({
  items,
  title,
}: {
  title: string
  items: typeof workspaceLinks
}) {
  return (
    <div>
      <div className='mb-2 px-2 text-[10px] tracking-[0.18em] text-muted-foreground uppercase'>
        {title}
      </div>
      <div className='space-y-1'>
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === '/' }}
            activeProps={{
              className: 'bg-card text-foreground shadow-sm ring-1 ring-border',
            }}
            className='flex items-center gap-3 rounded-md px-3 py-2.5 text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          >
            <item.icon className='size-4' />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function SideUtility({
  icon: Icon,
  label,
}: {
  icon: typeof Settings
  label: string
}) {
  return (
    <button className='flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'>
      <Icon className='size-4' />
      {label}
    </button>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className='mb-5 flex flex-wrap items-end justify-between gap-4'>
      <div>
        <div className='mb-2 text-[11px] tracking-[0.18em] text-muted-foreground uppercase'>
          {eyebrow}
        </div>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground md:text-3xl'>
          {title}
        </h1>
        {description && (
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: MetricCardProps) {
  return (
    <div className='group rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'>
      <div className='flex items-center justify-between gap-3'>
        <div className='text-[10px] tracking-[0.16em] text-muted-foreground uppercase'>
          {label}
        </div>
        <span
          className={cn(
            'size-2 rounded-full',
            tone === 'good' && 'bg-emerald-500',
            tone === 'risk' && 'bg-amber-500',
            tone === 'neutral' && 'bg-muted-foreground/35'
          )}
        />
      </div>
      <div className='mt-3 text-2xl font-semibold tracking-tight text-card-foreground'>
        {value}
      </div>
      <div className='mt-1 text-xs text-muted-foreground'>{hint}</div>
    </div>
  )
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm',
        className
      )}
    >
      <div className='mb-4 flex items-start justify-between gap-3'>
        <div>
          <h2 className='font-semibold text-card-foreground'>{title}</h2>
          {description && (
            <p className='mt-1 text-xs text-muted-foreground'>{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'good' | 'risk' | 'danger' | 'neutral' | 'muted'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium',
        tone === 'good' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        tone === 'risk' && 'border-amber-200 bg-amber-50 text-amber-700',
        tone === 'danger' && 'border-rose-200 bg-rose-50 text-rose-700',
        tone === 'neutral' && 'border-border bg-muted text-muted-foreground',
        tone === 'muted' &&
          'border-dashed border-border bg-card text-muted-foreground'
      )}
    >
      {children}
    </span>
  )
}

export function FooterNote() {
  return null
}

export function EmptyPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <>
      <PageHeader eyebrow='BuildFlow' title={title} description={description} />
      <Panel title='No content available'>
        <div className='rounded-sm border border-dashed border-border bg-muted/40 p-10 text-center text-muted-foreground'>
          There is no data to display yet.
        </div>
      </Panel>
    </>
  )
}

export function EmptyState({ message = 'No data available.' }: { message?: string }) {
  return (
    <div className='rounded-sm border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground'>
      {message}
    </div>
  )
}
