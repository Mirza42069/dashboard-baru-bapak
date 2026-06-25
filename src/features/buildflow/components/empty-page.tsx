import { PageHeader } from './page-header'
import { Panel } from './panel'

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
