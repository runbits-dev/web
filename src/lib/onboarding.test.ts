/**
 * Unit tests for onboarding helpers.
 *
 * Focus: `toBillingBusinessType` — the pure mapper that collapses a profile's
 * FunctionalType (which may be the combo 'food+appointment') down to billing's
 * BusinessType enum ('food'|'appointment'|'task'|'realtime'). Billing has no
 * combo value, so it must collapse; unknown/empty input falls back to the safe
 * default 'food' (matching billing's own default).
 */
import { describe, it, expect } from 'vitest'
import { toBillingBusinessType } from './onboarding'

describe('toBillingBusinessType', () => {
  it('passes through the 4 valid billing values unchanged', () => {
    expect(toBillingBusinessType('food')).toBe('food')
    expect(toBillingBusinessType('appointment')).toBe('appointment')
    expect(toBillingBusinessType('task')).toBe('task')
    expect(toBillingBusinessType('realtime')).toBe('realtime')
  })

  it("collapses 'food+appointment' to 'food' (food-primary)", () => {
    expect(toBillingBusinessType('food+appointment')).toBe('food')
  })

  it("falls back to 'food' for unknown, empty, null or undefined input", () => {
    expect(toBillingBusinessType('goods')).toBe('food')
    expect(toBillingBusinessType('')).toBe('food')
    expect(toBillingBusinessType(null)).toBe('food')
    expect(toBillingBusinessType(undefined)).toBe('food')
  })
})
