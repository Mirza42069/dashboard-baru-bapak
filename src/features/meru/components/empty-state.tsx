export function EmptyState({
  message = 'No data available.',
}: {
  message?: string
}) {
  return (
    <div className='rounded-sm border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground'>
      {message}
    </div>
  )
}
