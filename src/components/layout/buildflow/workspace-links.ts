import { Gauge, Grid2X2, Users } from 'lucide-react'

export const workspaceLinks = [
  { label: 'Dashboard', to: '/', icon: Gauge },
  { label: 'Projects', to: '/projects', icon: Grid2X2 },
  { label: 'Team & organisation', to: '/team', icon: Users },
]

export type WorkspaceLink = (typeof workspaceLinks)[number]
