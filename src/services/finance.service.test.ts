import { describe, expect, it } from 'vitest'

import {
  calculateLifeSimulation,
  calculateRunwayMonths,
  calculateSavingForecast,
} from './finance.service'

describe('finance service', () => {
  it('calculates income, expenses, savings and buffer', () => {
    expect(
      calculateLifeSimulation({
        salary: 300000,
        sideIncome: 20000,
        rent: 60000,
        food: 40000,
        utilities: 15000,
        internet: 7000,
        transport: 10000,
        entertainment: 20000,
        other: 40000,
        plannedSaving: 80000,
      }),
    ).toMatchObject({
      income: 320000,
      expenses: 192000,
      remaining: 128000,
      buffer: 48000,
    })
  })

  it('forecasts a finite savings date and handles a zero pace', () => {
    const forecast = calculateSavingForecast({
      currentSavings: 620000,
      targetSavings: 2000000,
      fallbackMonthlySaving: 54000,
      from: new Date('2026-08-01T00:00:00'),
    })
    expect(forecast).toMatchObject({
      predictable: true,
      months: 26,
      projectedDate: '2028-10',
    })
    expect(
      calculateSavingForecast({
        currentSavings: 0,
        targetSavings: 100,
        fallbackMonthlySaving: 0,
      }).predictable,
    ).toBe(false)
  })

  it('calculates emergency-fund runway without Infinity', () => {
    expect(calculateRunwayMonths(840000, 100000)).toBe(8.4)
    expect(calculateRunwayMonths(840000, 0)).toBeNull()
  })
})
