import { describe, expect, it } from 'vitest'

import { appMonthEnd, formatAppDate, formatAppMonth } from './date'

describe('application date helpers', () => {
  it('formats dates in Japan Standard Time at the UTC day boundary', () => {
    const date = new Date('2026-09-07T15:30:00.000Z')

    expect(formatAppDate(date)).toBe('2026-09-08')
    expect(formatAppMonth(date)).toBe('2026-09')
  })

  it('returns the last calendar day for a target month', () => {
    expect(appMonthEnd('2026-02')).toBe('2026-02-28')
    expect(appMonthEnd('2028-02')).toBe('2028-02-29')
  })
})
