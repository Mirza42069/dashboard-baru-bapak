import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/meru/pages'

export const Route = createFileRoute('/_authenticated/')({
  component: HomePage,
})
