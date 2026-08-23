import { describe, expect, it } from 'vitest'

import { calculateXpLevel, requiredXp } from './xp.service'

describe('xp service', () => {
  it('uses the fixed early thresholds', () => {
    expect([1, 2, 3, 4, 5].map(requiredXp)).toEqual([0, 100, 250, 500, 1000])
  })

  it('calculates the current level and bounded progress', () => {
    expect(calculateXpLevel(249).level).toBe(2)
    expect(calculateXpLevel(250).level).toBe(3)
    expect(calculateXpLevel(-100).progress).toBe(0)
  })
})
