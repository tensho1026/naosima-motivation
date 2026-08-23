import { describe, expect, it } from 'vitest'

import { calculateNaoshimaSunTimes } from './solar.service'

describe('solar service', () => {
  it('returns valid Japan-local sunrise and sunset times', () => {
    const result = calculateNaoshimaSunTimes(new Date('2026-06-21T00:00:00Z'))
    expect(result.sunrise).toMatch(/^\d{2}:\d{2}$/)
    expect(result.sunset).toMatch(/^\d{2}:\d{2}$/)
    expect(result.sunrise < result.sunset).toBe(true)
  })
})
