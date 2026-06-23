import { expect, test } from 'vitest'
import { boqSeedLeaves, computeTotals } from './boq'

test('contract total = sum(qty*rate) and progress is value-weighted', () => {
  const t = computeTotals(boqSeedLeaves)
  const expectedTotal = boqSeedLeaves.reduce((s, l) => s + l.qty * l.rate, 0)
  expect(t.total).toBe(expectedTotal)

  // value-weighted: cheap fully-done items can't pull overall to 100
  expect(t.pct).toBeGreaterThan(0)
  expect(t.pct).toBeLessThan(100)

  // an all-zero progress set reads 0%, an all-100 set reads 100%
  expect(computeTotals(boqSeedLeaves.map((l) => ({ ...l, pct: 0 }))).pct).toBe(0)
  expect(computeTotals(boqSeedLeaves.map((l) => ({ ...l, pct: 100 }))).pct).toBe(
    100
  )
})
