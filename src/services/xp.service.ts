const fixedThresholds = [0, 100, 250, 500, 1000] as const

export function requiredXp(level: number) {
  const normalized = Math.max(Math.trunc(level), 1)
  if (normalized <= fixedThresholds.length) {
    return fixedThresholds[normalized - 1]
  }
  return Math.round(100 * normalized ** 1.6)
}

export function calculateXpLevel(totalXp: number) {
  const xp = Math.max(Math.trunc(totalXp), 0)
  let level = 1
  while (level < 100 && requiredXp(level + 1) <= xp) level += 1
  const currentFloor = requiredXp(level)
  const nextTarget = requiredXp(level + 1)
  const progress =
    nextTarget === currentFloor
      ? 100
      : ((xp - currentFloor) / (nextTarget - currentFloor)) * 100
  return {
    level,
    currentFloor,
    nextTarget,
    progress: Math.min(Math.max(progress, 0), 100),
    title: migrationLevelTitle(level),
  }
}

export function migrationLevelTitle(level: number) {
  const titles = [
    '直島に興味あり',
    '未来を描き始めた',
    '小さな一歩を継続中',
    '移住条件を整備中',
    '島との距離を縮めている',
    '仕事と資金を強化中',
    '長期滞在を準備中',
    '暮らしを具体化中',
    '移住直前',
    '島暮らし準備完了',
  ]
  return titles[Math.min(Math.max(Math.trunc(level), 1), 10) - 1]
}
