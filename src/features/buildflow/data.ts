export type ProjectStatus = 'On track' | 'At risk' | 'Setup'
export type TenantStatus = 'Active' | 'Trial' | 'At risk' | 'Suspended'

export const projects = [
  {
    name: 'Riverside Tower B',
    owner: 'A. Okafor',
    code: 'PRJ-1042',
    progress: 29,
    status: 'On track' as ProjectStatus,
    value: '£118k',
    stage: 'Site clearance',
  },
  {
    name: 'Northgate Retail Park',
    owner: 'L. Marsh',
    code: 'PRJ-1038',
    progress: 42,
    status: 'At risk' as ProjectStatus,
    value: '£92k',
    stage: 'Reinforcement',
  },
  {
    name: 'Harbour Logistics Hub',
    owner: 'D. Singh',
    code: 'PRJ-1029',
    progress: 78,
    status: 'On track' as ProjectStatus,
    value: '£141k',
    stage: 'MEP coordination',
  },
  {
    name: 'Maple Court Flats',
    owner: 'R. Adeyemi',
    code: 'PRJ-1056',
    progress: 0,
    status: 'Setup' as ProjectStatus,
    value: '£54k',
    stage: 'BoQ import',
  },
]

export const systems = [
  { initials: 'XE', name: 'Xero', type: 'Accounting', status: 'Connected' },
  {
    initials: 'MP',
    name: 'MS Project',
    type: 'Scheduling',
    status: 'Connected',
  },
  {
    initials: 'RV',
    name: 'Autodesk Revit',
    type: 'BIM model',
    status: 'Connected',
  },
  {
    initials: 'SAP',
    name: 'SAP ERP',
    type: 'Finance / ERP',
    status: 'Syncing',
  },
  {
    initials: 'PC',
    name: 'Procore Docs',
    type: 'Documents',
    status: 'Not connected',
  },
]

export const activity = [
  {
    actor: 'A. Okafor',
    action: 'verified item 1.1 Site clearance',
    time: 'Today · 09:24',
  },
  {
    actor: 'Site team',
    action: 'updated 2.2 Reinforcement to 48%',
    time: 'Today · 08:10',
  },
  {
    actor: 'Xero sync',
    action: 'imported 3 cost transactions',
    time: 'Yesterday · 17:40',
  },
  { actor: 'L. Marsh', action: 'issued BoQ Rev A', time: '12 Mar · 14:02' },
]

export const attentionItems = [
  {
    title: '3.2 Structural steel behind schedule',
    detail: 'Actual 12% vs planned 35%',
  },
  {
    title: 'Procore Docs disconnected',
    detail: 'Re-authorise to resume document sync',
  },
  {
    title: 'Maple Court Flats has no BoQ',
    detail: 'Import or create to begin tracking',
  },
]

export const tenants = [
  {
    initials: 'MC',
    organisation: 'Meridian Construction Ltd',
    slug: 'tn_meridian',
    plan: 'Business',
    users: 34,
    projects: 12,
    status: 'Active' as TenantStatus,
    lastActive: '2m ago',
  },
  {
    initials: 'AC',
    organisation: 'Apex Civil Engineering',
    slug: 'tn_apex',
    plan: 'Enterprise',
    users: 210,
    projects: 88,
    status: 'Active' as TenantStatus,
    lastActive: 'just now',
  },
  {
    initials: 'BC',
    organisation: 'Birch & Co Builders',
    slug: 'tn_birch',
    plan: 'Starter',
    users: 6,
    projects: 2,
    status: 'Trial' as TenantStatus,
    lastActive: '1h ago',
  },
  {
    initials: 'SI',
    organisation: 'Summit Infrastructure',
    slug: 'tn_summit',
    plan: 'Enterprise',
    users: 156,
    projects: 64,
    status: 'Active' as TenantStatus,
    lastActive: '4h ago',
  },
  {
    initials: 'HD',
    organisation: 'Halcyon Developments',
    slug: 'tn_halcyon',
    plan: 'Business',
    users: 41,
    projects: 15,
    status: 'At risk' as TenantStatus,
    lastActive: '3d ago',
  },
  {
    initials: 'PR',
    organisation: 'Pine Ridge Homes',
    slug: 'tn_pine',
    plan: 'Starter',
    users: 4,
    projects: 1,
    status: 'Suspended' as TenantStatus,
    lastActive: '21d ago',
  },
]

export const team = [
  {
    name: 'Amina Okafor',
    role: 'Quantity surveyor',
    email: 'amina@meridian.example',
    projects: 4,
  },
  {
    name: 'Lewis Marsh',
    role: 'Project manager',
    email: 'lewis@meridian.example',
    projects: 3,
  },
  {
    name: 'Divya Singh',
    role: 'Site lead',
    email: 'divya@meridian.example',
    projects: 2,
  },
  {
    name: 'Rae Adeyemi',
    role: 'Finance controller',
    email: 'rae@meridian.example',
    projects: 5,
  },
]

export const subscriptions = [
  { plan: 'Starter', tenants: 18, mrr: '£2.1k', churnRisk: 'Low' },
  { plan: 'Business', tenants: 74, mrr: '£18.4k', churnRisk: 'Medium' },
  { plan: 'Enterprise', tenants: 36, mrr: '£41.8k', churnRisk: 'Low' },
]
