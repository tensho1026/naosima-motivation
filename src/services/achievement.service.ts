export type AchievementFacts = {
  completedMissions: number
  totalXp: number
  savings: number
  journeyKm: number
  readiness: number
  visitCount: number
  activityDays: number
  sideIncome: number
  remoteWork: number
}

export type AchievementRule = {
  code: string
  kind:
    | 'MISSION_COUNT'
    | 'TOTAL_XP'
    | 'SAVINGS'
    | 'JOURNEY'
    | 'READINESS'
    | 'VISIT_COUNT'
    | 'ACTIVITY_DAYS'
    | 'SIDE_INCOME'
    | 'REMOTE_WORK'
  threshold: number
}

const factByKind: Record<AchievementRule['kind'], keyof AchievementFacts> = {
  MISSION_COUNT: 'completedMissions',
  TOTAL_XP: 'totalXp',
  SAVINGS: 'savings',
  JOURNEY: 'journeyKm',
  READINESS: 'readiness',
  VISIT_COUNT: 'visitCount',
  ACTIVITY_DAYS: 'activityDays',
  SIDE_INCOME: 'sideIncome',
  REMOTE_WORK: 'remoteWork',
}

export function findUnlockedAchievements(
  rules: AchievementRule[],
  facts: AchievementFacts,
  alreadyUnlocked: ReadonlySet<string> = new Set(),
) {
  return rules.filter(
    (rule) =>
      !alreadyUnlocked.has(rule.code) &&
      facts[factByKind[rule.kind]] >= rule.threshold,
  )
}
