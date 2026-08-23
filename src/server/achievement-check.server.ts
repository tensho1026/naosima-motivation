import { calculateJourney } from '#/services/journey.service'
import { calculateReadiness } from '#/services/readiness.service'

import { contentRepository } from './content-repository.server'
import { coreRepository } from './core-repository.server'

export async function checkAndUnlockAchievements(
  repository: ReturnType<typeof coreRepository> = coreRepository(),
) {
  const [
    settings,
    { definitions, unlocked },
    missionsList,
    finance,
    totalXp,
    conditions,
    actions,
    career,
    visits,
  ] = await Promise.all([
    repository.getSettings(),
    repository.listAchievements(),
    repository.listMissions(),
    repository.getFinanceSettings(),
    repository.totalXp(),
    repository.listConditions(),
    repository.listActions(10_000),
    repository.listCareer(),
    contentRepository().listVisits(),
  ])
  const independentIncome = career.sources
    .filter((source) => source.active && source.type !== 'SALARY')
    .reduce((sum, source) => sum + source.monthlyAmount, 0)
  const values: Record<string, number> = {
    MISSION_COUNT: missionsList.filter((mission) => mission.completed).length,
    TOTAL_XP: totalXp,
    SAVINGS: finance?.currentSavings ?? 0,
    JOURNEY: calculateJourney(
      totalXp,
      settings?.virtualJourneyDistance ?? 1_000,
    ).progressKm,
    READINESS: calculateReadiness(conditions).overall,
    VISIT_COUNT: visits.length,
    ACTIVITY_DAYS: new Set(
      actions.map((action) => action.occurredAt.toISOString().slice(0, 10)),
    ).size,
    SIDE_INCOME: independentIncome,
    REMOTE_WORK: career.conditions.some(
      (condition) =>
        condition.completed &&
        /remote|リモート|場所/.test(condition.title.toLocaleLowerCase('ja')),
    )
      ? 1
      : 0,
  }
  const unlockedIds = new Set(unlocked.map((item) => item.achievementId))
  const candidates = definitions.filter(
    (definition) =>
      !unlockedIds.has(definition.id) &&
      (values[definition.kind] ?? 0) >= definition.threshold,
  )
  const inserted = await repository.unlockAchievementIds(
    candidates.map((definition) => definition.id),
  )
  const insertedIds = new Set(inserted.map((item) => item.achievementId))
  const newlyUnlocked = candidates.filter((definition) =>
    insertedIds.has(definition.id),
  )
  await repository.logAchievements(newlyUnlocked)
  return newlyUnlocked
}
