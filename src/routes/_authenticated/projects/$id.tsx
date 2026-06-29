import { createFileRoute } from '@tanstack/react-router'
import { ProjectDetailPage } from '@/features/buildflow/project-detail'

export const Route = createFileRoute('/_authenticated/projects/$id')({
  component: ProjectDetailPage,
})
