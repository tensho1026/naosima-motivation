import type {
  MigrationCondition,
  ProgressCategory,
  ReadinessStatus,
} from '#/types/domain'
import { progressCategories } from '#/types/domain'

export const readinessWeights: Record<ProgressCategory, number> = {
  MONEY: 0.25,
  WORK: 0.25,
  SKILL: 0.2,
  LIFESTYLE: 0.15,
  NAOSHIMA: 0.1,
  CONNECTION: 0.05,
}

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100)
}

function effectiveCompletion(condition: MigrationCondition) {
  return condition.completed ? 1 : 0
}

export function calculateCategoryProgress(
  conditions: MigrationCondition[],
): Record<ProgressCategory, number> {
  return Object.fromEntries(
    progressCategories.map((category) => {
      const scoped = conditions.filter(
        (condition) => condition.category === category,
      )
      const totalWeight = scoped.reduce(
        (sum, condition) => sum + Math.max(condition.weight, 0),
        0,
      )
      if (totalWeight === 0) return [category, 0]
      const completedWeight = scoped.reduce(
        (sum, condition) =>
          sum + Math.max(condition.weight, 0) * effectiveCompletion(condition),
        0,
      )
      return [category, clampPercent((completedWeight / totalWeight) * 100)]
    }),
  ) as Record<ProgressCategory, number>
}

export function calculateReadiness(conditions: MigrationCondition[]) {
  const categories = calculateCategoryProgress(conditions)
  const overall = clampPercent(
    progressCategories.reduce(
      (sum, category) =>
        sum + categories[category] * readinessWeights[category],
      0,
    ),
  )
  return { categories, overall }
}

export function calculateReadyStatus(
  conditions: MigrationCondition[],
): ReadinessStatus {
  const required = conditions.filter((condition) => condition.required)
  if (required.length === 0) return 'NOT_READY'
  if (required.every((condition) => condition.completed)) {
    return 'READY'
  }
  const ratio =
    required.reduce(
      (sum, condition) => sum + effectiveCompletion(condition),
      0,
    ) / required.length
  return ratio >= 0.75 ? 'ALMOST_READY' : 'NOT_READY'
}
