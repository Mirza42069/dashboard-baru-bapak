import { createFileRoute } from '@tanstack/react-router'
import { HelpCenterPage } from '@/features/meru/pages'

export const Route = createFileRoute('/_authenticated/help-center/')({
  component: HelpCenterPage,
})
