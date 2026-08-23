import { describe, expect, it } from 'vitest'

import {
  calculateNoZeroWeek,
  calculatePace,
  calculateStreak,
  calculateVisitStats,
  lifeRatio,
  reverseCalendar,
  weeklyXpActivity,
} from './insights.service'

describe('insights service', () => {
  it('calculates visit totals, longest stay and time since visit', () => {
    expect(
      calculateVisitStats(
        [
          { startDate: '2026-01-01', endDate: '2026-01-03' },
          { startDate: '2026-02-10', endDate: '2026-02-10' },
        ],
        new Date('2026-02-20T00:00:00Z'),
      ),
    ).toEqual({
      visits: 2,
      totalDays: 4,
      totalHours: 96,
      longestStayDays: 3,
      daysSinceLastVisit: 10,
    })
  })

  it('calculates streak and no-zero-week independently', () => {
    const actions = [
      { occurredAt: new Date('2026-08-23T02:00:00Z') },
      { occurredAt: new Date('2026-08-22T02:00:00Z') },
      { occurredAt: new Date('2026-08-21T02:00:00Z') },
    ]
    const now = new Date('2026-08-23T12:00:00Z')
    expect(calculateStreak(actions, now)).toBe(3)
    expect(calculateNoZeroWeek(actions, now)).toEqual({
      achieved: true,
      actionCount: 3,
    })
  })

  it('keeps zero-XP days in weekly activity', () => {
    const result = weeklyXpActivity(
      [
        { occurredAt: new Date('2026-08-17T02:00:00Z'), amount: 10 },
        { occurredAt: new Date('2026-08-19T02:00:00Z'), amount: 20 },
      ],
      new Date('2026-08-20T12:00:00Z'),
    )
    expect(result).toHaveLength(7)
    expect(result.map((day) => day.xp)).toEqual([10, 0, 20, 0, 0, 0, 0])
  })

  it('labels savings pace against the target', () => {
    expect(calculatePace('2030-04-01', '2030-01')).toEqual({
      monthsDelta: 3,
      status: '予定より3か月先行',
    })
    expect(calculatePace('2030-04-01', null).monthsDelta).toBeNull()
  })

  it('reverse-calculates monthly and weekly saving needs', () => {
    const result = reverseCalendar({
      targetDate: '2027-01-01',
      monthlySavingTarget: 50_000,
      remainingSavings: 600_000,
      today: new Date('2026-01-01T00:00:00Z'),
    })
    expect(result.requiredMonthlySaving).toBe(50_000)
    expect(result.week).toContain('12,500円')
  })

  it('calculates the share of life spent on Naoshima', () => {
    const result = lifeRatio({
      birthDate: '2000-01-01',
      islandDays: 100,
      today: new Date('2025-01-01T00:00:00Z'),
    })
    expect(result?.livedDays).toBe(9_132)
    expect(result?.percent).toBeCloseTo(1.095, 2)
  })
})
