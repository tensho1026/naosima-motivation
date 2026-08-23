export const progressCategories = [
  'MONEY',
  'WORK',
  'SKILL',
  'LIFESTYLE',
  'NAOSHIMA',
  'CONNECTION',
] as const

export type ProgressCategory = (typeof progressCategories)[number]

export const missionTypes = ['DAILY', 'MONTHLY', 'YEARLY'] as const
export type MissionType = (typeof missionTypes)[number]

export type ReadinessStatus = 'NOT_READY' | 'ALMOST_READY' | 'READY'

export type MigrationCondition = {
  category: ProgressCategory
  completed: boolean
  currentValue?: number | null
  required: boolean
  targetValue?: number | null
  title: string
  unit?: string | null
  weight: number
}

export type ScenarioInput = {
  monthlyExpenses: number
  monthlyIncome: number
  monthlySaving: number
  name: string
  currentSavings: number
  targetSavings: number
}
