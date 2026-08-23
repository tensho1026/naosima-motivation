import { describe, expect, it } from 'vitest'

import { findUnlockedAchievements } from './achievement.service'

describe('achievement service', () => {
  it('returns newly satisfied rules only', () => {
    const unlocked = findUnlockedAchievements(
      [
        { code: 'FIRST', kind: 'MISSION_COUNT', threshold: 1 },
        { code: 'XP100', kind: 'TOTAL_XP', threshold: 100 },
        { code: 'SAVER', kind: 'SAVINGS', threshold: 100000 },
      ],
      {
        completedMissions: 2,
        totalXp: 120,
        savings: 90000,
        journeyKm: 12,
        readiness: 20,
        visitCount: 0,
        activityDays: 3,
        sideIncome: 0,
      },
      new Set(['FIRST']),
    )
    expect(unlocked.map((rule) => rule.code)).toEqual(['XP100'])
  })
})
