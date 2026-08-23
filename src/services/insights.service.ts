import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  eachDayOfInterval,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
  subDays,
} from 'date-fns'

export type ActivityLike = { occurredAt: Date; amount?: number | null }
export type VisitLike = { startDate: string; endDate: string }

export function activityHeatmap(actions: ActivityLike[], days = 365) {
  const end = new Date()
  const start = subDays(end, Math.max(days - 1, 0))
  const counts = new Map<string, number>()
  for (const action of actions) {
    const key = format(action.occurredAt, 'yyyy-MM-dd')
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return eachDayOfInterval({ start, end }).map((date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return { date: dateKey, count: counts.get(dateKey) ?? 0 }
  })
}

export function calculateStreak(actions: ActivityLike[], today = new Date()) {
  const active = new Set(
    actions.map((action) => format(action.occurredAt, 'yyyy-MM-dd')),
  )
  let streak = 0
  for (let offset = 0; offset <= 10_000; offset += 1) {
    const key = format(subDays(today, offset), 'yyyy-MM-dd')
    if (!active.has(key)) {
      if (offset === 0) continue
      break
    }
    streak += 1
  }
  return streak
}

export function calculateNoZeroWeek(
  actions: ActivityLike[],
  today = new Date(),
) {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const actionCount = actions.filter(
    (action) => action.occurredAt >= weekStart && action.occurredAt <= weekEnd,
  ).length
  return { achieved: actionCount > 0, actionCount }
}

export function weeklyXpActivity(actions: ActivityLike[], today = new Date()) {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const days = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(today, { weekStartsOn: 1 }),
  })
  const labels = ['月', '火', '水', '木', '金', '土', '日']
  return days.map((date, index) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const xp = actions
      .filter((action) => format(action.occurredAt, 'yyyy-MM-dd') === dateKey)
      .reduce((sum, action) => sum + Math.max(action.amount ?? 0, 0), 0)
    return { date: dateKey, day: labels[index], xp }
  })
}

export function calculateVisitStats(visits: VisitLike[], today = new Date()) {
  const durations = visits.map(
    (visit) =>
      Math.max(
        differenceInCalendarDays(
          parseISO(visit.endDate),
          parseISO(visit.startDate),
        ),
        0,
      ) + 1,
  )
  const totalDays = durations.reduce((sum, days) => sum + days, 0)
  const latestEnd = visits
    .map((visit) => visit.endDate)
    .sort()
    .at(-1)
  return {
    visits: visits.length,
    totalDays,
    totalHours: totalDays * 24,
    longestStayDays: Math.max(0, ...durations),
    daysSinceLastVisit: latestEnd
      ? Math.max(differenceInCalendarDays(today, parseISO(latestEnd)), 0)
      : null,
  }
}

export function calculatePace(
  targetDate: string,
  projectedMonth: string | null,
) {
  if (!projectedMonth) {
    return { monthsDelta: null, status: '予測に必要な記録が不足' as const }
  }
  const delta = differenceInCalendarMonths(
    parseISO(`${targetDate.slice(0, 7)}-01`),
    parseISO(`${projectedMonth}-01`),
  )
  return {
    monthsDelta: delta,
    status:
      delta >= 2
        ? (`予定より${delta}か月先行` as const)
        : delta <= -2
          ? (`資金面が${Math.abs(delta)}か月遅れ` as const)
          : ('ほぼ予定通り' as const),
  }
}

export function reverseCalendar({
  targetDate,
  monthlySavingTarget,
  remainingSavings,
  today = new Date(),
}: {
  targetDate: string
  monthlySavingTarget: number
  remainingSavings: number
  today?: Date
}) {
  const target = parseISO(targetDate)
  const months = Math.max(differenceInCalendarMonths(target, today), 1)
  const requiredMonthlySaving = Math.ceil(
    Math.max(remainingSavings, 0) / months,
  )
  return {
    year: `${target.getFullYear() - 1}年中に移住条件を完成させる`,
    month: `今月は${Math.max(requiredMonthlySaving, monthlySavingTarget).toLocaleString('ja-JP')}円を移住資金へ`,
    week: `今週は${Math.ceil(Math.max(requiredMonthlySaving, monthlySavingTarget) / 4).toLocaleString('ja-JP')}円分の余白をつくる`,
    requiredMonthlySaving,
  }
}

export function lifeRatio({
  birthDate,
  islandDays,
  today = new Date(),
}: {
  birthDate?: string | null
  islandDays: number
  today?: Date
}) {
  if (!birthDate) return null
  const livedDays = Math.max(
    differenceInCalendarDays(today, parseISO(birthDate)),
    1,
  )
  return {
    livedDays,
    islandDays,
    percent: (islandDays / livedDays) * 100,
  }
}
