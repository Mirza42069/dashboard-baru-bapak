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
