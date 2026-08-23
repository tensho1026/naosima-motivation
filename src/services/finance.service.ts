import { addMonths, format } from 'date-fns'

import type { ScenarioInput } from '#/types/domain'

export type LifeSimulationInput = {
  salary: number
  sideIncome: number
  rent: number
  food: number
  utilities: number
  internet: number
  transport: number
  entertainment: number
  other: number
  plannedSaving: number
}

export type SavingLike = {
  amount: number
  type: 'DEPOSIT' | 'WITHDRAWAL'
  date: string
}

export function monthlySavingHistory(transactions: SavingLike[]) {
  const totals = new Map<string, number>()
  for (const transaction of transactions) {
    const month = transaction.date.slice(0, 7)
    const delta =
      transaction.type === 'DEPOSIT' ? transaction.amount : -transaction.amount
    totals.set(month, (totals.get(month) ?? 0) + delta)
  }
  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, amount]) => ({ month, amount }))
}

export function averageRecentMonthlySaving(
  transactions: SavingLike[],
  months = 3,
) {
  const recent = monthlySavingHistory(transactions).slice(-Math.max(months, 1))
  if (recent.length === 0) return undefined
  return recent.reduce((sum, row) => sum + row.amount, 0) / recent.length
}

export function calculateLifeSimulation(input: LifeSimulationInput) {
  const income = input.salary + input.sideIncome
  const expenses =
    input.rent +
    input.food +
    input.utilities +
    input.internet +
    input.transport +
    input.entertainment +
    input.other
  const remaining = income - expenses
  return {
    income,
    expenses,
    remaining,
    plannedSaving: input.plannedSaving,
    buffer: remaining - input.plannedSaving,
    dailyCost: expenses / 30.4,
  }
}

export function calculateSavingForecast({
  currentSavings,
  targetSavings,
  averageMonthlySaving,
  fallbackMonthlySaving,
  from = new Date(),
}: {
  currentSavings: number
  targetSavings: number
  averageMonthlySaving?: number
  fallbackMonthlySaving: number
  from?: Date
}) {
  const pace =
    averageMonthlySaving == null ? fallbackMonthlySaving : averageMonthlySaving
  const remaining = Math.max(targetSavings - currentSavings, 0)
  if (remaining === 0) {
    return {
      predictable: true,
      months: 0,
      projectedDate: format(from, 'yyyy-MM'),
    }
  }
  if (!Number.isFinite(pace) || pace <= 0) {
    return { predictable: false, months: null, projectedDate: null }
  }
  const months = Math.ceil(remaining / pace)
  return {
    predictable: true,
    months,
    projectedDate: format(addMonths(from, months), 'yyyy-MM'),
  }
}

export function calculateScenario<T extends ScenarioInput>(
  scenario: T,
  from = new Date(),
) {
  const cashFlow = scenario.monthlyIncome - scenario.monthlyExpenses
  const savingPace = Math.min(
    Math.max(scenario.monthlySaving, 0),
    Math.max(cashFlow, 0),
  )
  return {
    ...scenario,
    cashFlow,
    forecast: calculateSavingForecast({
      currentSavings: scenario.currentSavings,
      targetSavings: scenario.targetSavings,
      fallbackMonthlySaving: savingPace,
      from,
    }),
  }
}

export function calculateRunwayMonths(
  savings: number,
  monthlyExpenses: number,
) {
  if (monthlyExpenses <= 0) return null
  return Math.max(savings, 0) / monthlyExpenses
}

export function calculateFreedomScore({
  remoteWork,
  sideIncomeRatio,
  savingsRunwayMonths,
  skillProgress,
  fixedCostRatio,
}: {
  remoteWork: number
  sideIncomeRatio: number
  savingsRunwayMonths: number
  skillProgress: number
  fixedCostRatio: number
}) {
  const normalizedRunway = Math.min(Math.max(savingsRunwayMonths / 12, 0), 1)
  const score =
    remoteWork * 0.3 +
    sideIncomeRatio * 0.2 +
    normalizedRunway * 0.2 +
    skillProgress * 0.2 +
    (1 - fixedCostRatio) * 0.1
  return Math.min(Math.max(score * 100, 0), 100)
}
