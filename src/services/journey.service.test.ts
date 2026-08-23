import { describe, expect, it } from 'vitest'

import {
  calculateCountdown,
  calculateJourney,
  haversineDistanceKm,
} from './journey.service'

describe('journey service', () => {
  it('converts XP into the bounded 1000km journey', () => {
    expect(calculateJourney(6240)).toEqual({
      progressKm: 624,
      remainingKm: 376,
      progressPercent: 62.4,
      totalDistance: 1000,
    })
    expect(calculateJourney(20_000).remainingKm).toBe(0)
  })

  it('never displays a negative countdown', () => {
    expect(
      calculateCountdown('2020-01-01', new Date('2026-08-23T00:00:00')).days,
    ).toBe(0)
  })

  it('calculates a physical distance without confusing it with virtual progress', () => {
    const distance = haversineDistanceKm({
      latitude: 35.0116,
      longitude: 135.7681,
    })
    expect(distance).toBeGreaterThan(170)
    expect(distance).toBeLessThan(180)
  })
})
