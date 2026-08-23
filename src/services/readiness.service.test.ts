import { describe, expect, it } from 'vitest'

import type { MigrationCondition } from '#/types/domain'

import {
  calculateCategoryProgress,
  calculateReadiness,
  calculateReadyStatus,
} from './readiness.service'

const conditions: MigrationCondition[] = [
  {
    title: '資金',
    category: 'MONEY',
    completed: false,
    required: true,
    weight: 3,
    currentValue: 50,
    targetValue: 100,
  },
  {
    title: '仕事',
    category: 'WORK',
    completed: true,
    required: true,
    weight: 1,
  },
]

describe('readiness service', () => {
  it('uses weighted condition progress and zero for empty categories', () => {
    const result = calculateCategoryProgress(conditions)
    expect(result.MONEY).toBe(0)
    expect(result.WORK).toBe(100)
    expect(result.SKILL).toBe(0)
  })

  it('applies the six category weights and clamps the result', () => {
    expect(calculateReadiness(conditions).overall).toBe(25)
  })

  it('distinguishes required-condition readiness', () => {
    expect(calculateReadyStatus([])).toBe('NOT_READY')
    expect(calculateReadyStatus(conditions)).toBe('NOT_READY')
    expect(
      calculateReadyStatus([
        ...conditions.map((condition) => ({
          ...condition,
          completed: true,
        })),
        {
          title: '生活',
          category: 'LIFESTYLE',
          completed: true,
          required: true,
          weight: 1,
        },
        {
          title: 'つながり',
          category: 'CONNECTION',
          completed: false,
          required: true,
          weight: 1,
        },
      ]),
    ).toBe('ALMOST_READY')
    expect(
      calculateReadyStatus(
        conditions.map((condition) => ({ ...condition, completed: true })),
      ),
    ).toBe('READY')
  })
})
