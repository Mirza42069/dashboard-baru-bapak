import { Link, Outlet, useLocation } from '@tanstack/react-router'
import {
  ChevronDown,
  CircleHelp,
  Gauge,
  Grid2X2,
  Layers3,
  Search,
  Settings,
  SquareMenu,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type MetricCardProps = {
  label: string
  value: string
  hint: string
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

  return (
    <div className='min-h-svh bg-[#f3f3f3] text-[13px] text-slate-800'>
      <header className='flex h-12 items-center border-b border-[#d4d4d4] bg-[#eeeeee] px-3'>
        <div className='flex min-w-52 items-center gap-2'>
          <Button
            variant='outline'
            size='icon'
            className='size-7 rounded-[5px] bg-white'
          >
            <Grid2X2 className='size-3.5' />
          </Button>
          <div className='font-semibold tracking-tight'>BUILDFLOW</div>
          <Badge
            variant='outline'
            className='h-5 rounded-[3px] bg-white/50 px-1.5 text-[10px] font-normal tracking-[0.18em] text-slate-400'
          >
            WIREFRAME
          </Badge>
        </div>

        <div className='flex rounded-[5px] border border-[#d0d0d0] bg-[#e2e2e2] p-0.5'>
          <ModeLink active={!isPlatform} to='/' label='Tenant workspace' />
          <ModeLink active={isPlatform} to='/tenants' label='Platform admin' />
        </div>

        <div className='ms-auto flex items-center gap-3'>
          {!isPlatform && (
            <span className='hidden text-slate-400 md:inline'>Org:</span>
          )}
          {!isPlatform && (
            <Button
              variant='outline'
              className='hidden h-8 gap-2 rounded-[5px] bg-white px-3 font-normal md:flex'
            >
              <span className='size-4 rounded bg-slate-200' />
              Meridian Construction Ltd
              <ChevronDown className='size-3' />
            </Button>
          )}
          <div className='relative hidden sm:block'>
            <Search className='absolute start-3 top-1/2 size-3 -translate-y-1/2 text-slate-400' />
            <Input
              className='h-8 w-48 rounded-[5px] bg-white ps-8 text-xs'
              placeholder='Search...'
            />
          </div>
          <Avatar className='size-8 bg-slate-300'>
            <AvatarFallback className='text-xs'>CM</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className='grid min-h-[calc(100svh-3rem)] grid-cols-1 md:grid-cols-[228px_1fr]'>
        <aside className='flex border-r border-[#d4d4d4] bg-[#ededed] md:min-h-[calc(100svh-3rem)] md:flex-col'>
          <nav className='flex flex-1 gap-1 overflow-x-auto p-3 md:block md:space-y-7'>
            <NavSection
              title={isPlatform ? 'Platform' : 'Workspace'}
              items={isPlatform ? platformLinks : workspaceLinks}
            />
          </nav>
          <div className='mt-auto hidden border-t border-[#d4d4d4] p-3 md:block'>
            <SideUtility icon={Settings} label='Settings' />
            <SideUtility icon={CircleHelp} label='Help & support' />
          </div>
        </aside>
        <main className='overflow-x-hidden px-4 py-6 md:px-6'>
          <div className='max-w-7xl'>
            <Outlet />
            <FooterNote />
          </div>
        </main>
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
        'rounded-[5px] px-4 py-1.5 text-xs text-slate-500',
        active && 'bg-white text-slate-950 shadow-xs'
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
    <div className='min-w-max md:min-w-0'>
      <div className='mb-2 hidden px-2 text-[10px] tracking-[0.18em] text-slate-400 uppercase md:block'>
        {title}
      </div>
      <div className='flex gap-1 md:block md:space-y-1'>
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === '/' }}
            activeProps={{
              className:
                'bg-[#dedede] text-slate-950 shadow-[inset_3px_0_0_#777]',
            }}
            className='flex items-center gap-3 rounded-[6px] px-3 py-2 text-slate-600 hover:bg-[#e3e3e3]'
          >
            <item.icon className='size-3.5' />
            {item.label}
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
    <button className='flex w-full items-center gap-3 rounded-[6px] px-2 py-2 text-left text-slate-500 hover:bg-[#e3e3e3]'>
      <Icon className='size-3.5' />
      {label}
    </button>
  )
}

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className='mb-5 flex flex-wrap items-end justify-between gap-3'>
      <div>
        <div className='mb-2 text-[11px] tracking-[0.18em] text-slate-400 uppercase'>
          {eyebrow}
        </div>
        <h1 className='text-2xl font-semibold tracking-tight text-slate-950'>
          {title}
        </h1>
      </div>
      {action}
    </div>
  )
}

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <div className='rounded-[6px] border border-[#d8d8d8] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]'>
      <div className='text-[10px] tracking-[0.18em] text-slate-400 uppercase'>
        {label}
      </div>
      <div className='mt-2 text-2xl font-semibold tracking-tight text-slate-950'>
        {value}
      </div>
      <div className='mt-1 text-xs text-slate-500'>{hint}</div>
    </div>
  )
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-[6px] border border-[#d8d8d8] bg-white p-4',
        className
      )}
    >
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='font-medium text-slate-950'>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function StatusPill({
  children,
  muted,
}: {
  children: React.ReactNode
  muted?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full bg-[#dedede] px-2 py-1 text-[11px] font-medium text-slate-700',
        muted && 'border border-dashed border-[#c9c9c9] bg-white text-slate-500'
      )}
    >
      {children}
    </span>
  )
}

function FooterNote() {
  return (
    <div className='mt-6 border-t border-dashed border-[#d4d4d4] pt-4 text-xs text-slate-400'>
      Low-fi wireframe <span className='mx-3'>·</span> Open a project → Bill of
      Quantities → Revise to unlock qty/rate, or edit % directly
    </div>
  )
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
      <PageHeader eyebrow='BuildFlow' title={title} />
      <Panel title={title}>
        <div className='rounded-[6px] border border-dashed border-[#d4d4d4] bg-[#fafafa] p-8 text-center text-slate-500'>
          {description}
        </div>
      </Panel>
    </>
  )
}
