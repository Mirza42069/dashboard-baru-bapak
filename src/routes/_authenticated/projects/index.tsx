import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/features/buildflow/pages'

export const Route = createFileRoute('/_authenticated/projects/')({
  component: ProjectsPage,
})
