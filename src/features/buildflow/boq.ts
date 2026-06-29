// Bill of Quantities domain: section/leaf rows + pure totals math.

export type BoqLeaf = {
  id: string
  sectionId: string
  code: string
  desc: string
  unit: string
  qty: number
  rate: number
  pct: number // 0..100 complete
}

export type BoqSection = { id: string; num: string; name: string }

export const boqSections: BoqSection[] = []

export const boqSeedLeaves: BoqLeaf[] = []

export const amount = (l: Pick<BoqLeaf, 'qty' | 'rate'>) => l.qty * l.rate

export function leafStatus(pct: number) {
  if (pct >= 100) return { label: 'Complete', tone: 'good' as const }
  if (pct <= 0) return { label: 'Not started', tone: 'muted' as const }
  return { label: 'In progress', tone: 'risk' as const }
}

export type SectionTotals = {
  section: BoqSection
  leaves: BoqLeaf[]
  amount: number
  pct: number // value-weighted % complete
}

export type BoqTotals = {
  sections: SectionTotals[]
  total: number
  pct: number
}

// Value-weighted progress: a 90%-done £1m item outweighs a 100%-done £1k item.
export function computeTotals(leaves: BoqLeaf[]): BoqTotals {
  const sourceSections = boqSections.length
    ? boqSections
    : Array.from(new Set(leaves.map((leaf) => leaf.sectionId))).map(
        (sectionId, index) => ({
          id: sectionId,
          num: String(index + 1),
          name: sectionId,
        })
      )

  const sections = sourceSections.map((section) => {
    const secLeaves = leaves.filter((l) => l.sectionId === section.id)
    const amt = secLeaves.reduce((s, l) => s + amount(l), 0)
    const done = secLeaves.reduce((s, l) => s + amount(l) * (l.pct / 100), 0)
    return {
      section,
      leaves: secLeaves,
      amount: amt,
      pct: amt ? Math.round((done / amt) * 100) : 0,
    }
  })
  const total = sections.reduce((s, x) => s + x.amount, 0)
  const done = sections.reduce((s, x) => s + x.amount * (x.pct / 100), 0)
  return { sections, total, pct: total ? Math.round((done / total) * 100) : 0 }
}

export const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB')

// Common construction Bill-of-Quantities units for the unit picker.
// `value` is what's stored on the item; `label` is the searchable description.
export const boqUnits: { value: string; label: string }[] = [
  { value: 'ls', label: 'Lump sum' },
  { value: 'item', label: 'Item' },
  { value: 'no', label: 'Number / each' },
  { value: 'set', label: 'Set' },
  { value: 'pair', label: 'Pair' },
  { value: 'm', label: 'Metre' },
  { value: 'm²', label: 'Square metre' },
  { value: 'm³', label: 'Cubic metre' },
  { value: 'mm', label: 'Millimetre' },
  { value: 'cm', label: 'Centimetre' },
  { value: 'km', label: 'Kilometre' },
  { value: 'lm', label: 'Linear metre' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'ton', label: 'Tonne' },
  { value: 'g', label: 'Gram' },
  { value: 'l', label: 'Litre' },
  { value: 'hr', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'pcs', label: 'Pieces' },
  { value: 'roll', label: 'Roll' },
  { value: 'sheet', label: 'Sheet' },
  { value: 'bag', label: 'Bag' },
  { value: 'drum', label: 'Drum' },
  { value: 'sum', label: 'Sum' },
  { value: 'visit', label: 'Visit' },
  { value: 'point', label: 'Point' },
  { value: '%', label: 'Percent' },
]
