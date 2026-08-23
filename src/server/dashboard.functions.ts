import { createServerFn } from '@tanstack/react-start'

import {
  calculateFreedomScore,
  calculateLifeSimulation,
  calculateRunwayMonths,
  calculateSavingForecast,
  calculateScenario,
} from '#/services/finance.service'
import {
  calculateCountdown,
  calculateJourney,
  calculateJourneyDays,
  summersUntil,
} from '#/services/journey.service'
import {
  activityHeatmap,
  calculateNoZeroWeek,
  calculatePace,
  calculateStreak,
  calculateVisitStats,
  lifeRatio,
  reverseCalendar,
} from '#/services/insights.service'
import {
  calculateReadiness,
  calculateReadyStatus,
} from '#/services/readiness.service'
import { calculateNaoshimaSunTimes } from '#/services/solar.service'
import { calculateXpLevel } from '#/services/xp.service'

import { contentRepository } from './content-repository.server'
import { coreRepository } from './core-repository.server'

function numberValue(value: unknown) {
  return typeof value === 'number' ? value : Number(value) || 0
}

export const getDashboard = createServerFn({ method: 'GET' }).handler(
  async () => {
    const core = coreRepository()
    const content = contentRepository()
    const [
      settings,
      totalXp,
      conditions,
      roadmap,
      missions,
      finance,
      savings,
      lifeSimulations,
      scenarios,
      career,
      skills,
      actions,
      achievements,
      visits,
      memories,
      photos,
      reasons,
      bucket,
      nextVisit,
      extras,
    ] = await Promise.all([
      core.getSettings(),
      core.totalXp(),
      core.listConditions(),
      core.listRoadmap(),
      core.listMissions(),
      core.getFinanceSettings(),
      core.listSavings(),
      core.listLifeSimulations(),
      core.listScenarios(),
      core.listCareer(),
      core.listSkills(),
      core.listActions(500),
      core.listAchievements(),
      content.listVisits(),
      content.listMemories(),
      content.listPhotos(),
      content.listReasons(),
      content.listBucketItems(),
      content.listNextVisitItems(),
      content.listExtras([
        'timeInvestmentLogs',
        'moneyInvestmentLogs',
        'milestoneEvents',
        'selfMessages',
        'originStories',
        'seasonGoals',
        'focusSettings',
        'anniversaries',
        'decisionLogs',
        'antiGoals',
        'fixedCostReductions',
        'moodLogs',
        'islandQuests',
        'calendarEvents',
      ]),
    ])

    const targetDate = settings?.migrationTargetDate ?? '2030-04-01'
    const journeyStartedAt = settings?.journeyStartedAt ?? '2026-08-23'
    const readiness = calculateReadiness(conditions)
    const journey = calculateJourney(
      totalXp,
      settings?.virtualJourneyDistance ?? 1_000,
    )
    const averageMonthlySaving =
      savings.length > 0
        ? savings
            .slice(0, 3)
            .reduce(
              (sum, transaction) =>
                sum +
                (transaction.type === 'DEPOSIT'
                  ? transaction.amount
                  : -transaction.amount),
              0,
            ) / Math.min(savings.length, 3)
        : undefined
    const forecast = finance
      ? calculateSavingForecast({
          currentSavings: finance.currentSavings,
          targetSavings: finance.targetSavings,
          averageMonthlySaving,
          fallbackMonthlySaving: finance.monthlySavingTarget,
        })
      : null
    const countdown = calculateCountdown(targetDate)
    const visitStats = calculateVisitStats(visits)
    const totalIncome = career.sources
      .filter((source) => source.active)
      .reduce((sum, source) => sum + source.monthlyAmount, 0)
    const independentIncome = career.sources
      .filter((source) => source.active && source.type !== 'SALARY')
      .reduce((sum, source) => sum + source.monthlyAmount, 0)
    const currentLife = lifeSimulations[0]
      ? calculateLifeSimulation(lifeSimulations[0])
      : null
    const remoteCondition = career.conditions.find((condition) =>
      /remote|リモート|場所/.test(condition.title.toLowerCase()),
    )
    const skillProgress =
      skills.length > 0
        ? skills.reduce(
            (sum, skill) => sum + skill.level / Math.max(skill.targetLevel, 1),
            0,
          ) / skills.length
        : 0
    const runwayMonths = calculateRunwayMonths(
      finance?.currentSavings ?? 0,
      currentLife?.expenses ?? 0,
    )
    const freedomScore = calculateFreedomScore({
      remoteWork: remoteCondition?.completed ? 1 : 0,
      sideIncomeRatio: totalIncome > 0 ? independentIncome / totalIncome : 0,
      savingsRunwayMonths: runwayMonths ?? 0,
      skillProgress,
      fixedCostRatio:
        totalIncome > 0 && currentLife
          ? Math.min(currentLife.expenses / totalIncome, 1)
          : 1,
    })
    const fixedCostMonthlyReduction = (extras.fixedCostReductions ?? []).reduce(
      (sum, row) => sum + numberValue(row.monthlyAmount),
      0,
    )
    const timeInvestmentMinutes = (extras.timeInvestmentLogs ?? []).reduce(
      (sum, row) => sum + numberValue(row.minutes),
      0,
    )
    const moneyInvestment = (extras.moneyInvestmentLogs ?? []).reduce(
      (sum, row) => sum + numberValue(row.amount),
      0,
    )
    const incomplete = missions.filter((mission) => !mission.completed)
    const weeklyPriority = incomplete.find((mission) => mission.weeklyPriority)
    const todayStep =
      weeklyPriority ??
      incomplete.sort((a, b) => b.impactScore - a.impactScore)[0] ??
      null
    const minimumMission = incomplete.find((mission) => mission.minimumTitle)
    const randomPool = [
      ...photos.map((photo) => ({ kind: 'PHOTO' as const, value: photo })),
      ...memories.map((memory) => ({ kind: 'MEMORY' as const, value: memory })),
      ...reasons.map((reason) => ({ kind: 'REASON' as const, value: reason })),
    ]
    const randomIndex =
      Math.floor(Date.now() / 86_400_000) % Math.max(randomPool.length, 1)

    return {
      settings,
      countdown,
      journeyDays: calculateJourneyDays(journeyStartedAt),
      summersUntil: summersUntil(targetDate),
      readiness,
      readyStatus: calculateReadyStatus(conditions),
      journey,
      totalXp,
      xpLevel: calculateXpLevel(totalXp),
      conditions,
      roadmap,
      missions,
      todayStep,
      minimumMission,
      noZeroWeek: calculateNoZeroWeek(actions),
      streak: calculateStreak(actions),
      heatmap: activityHeatmap(actions),
      finance,
      savings,
      forecast,
      pace: calculatePace(targetDate, forecast?.projectedDate ?? null),
      reverseCalendar: reverseCalendar({
        targetDate,
        monthlySavingTarget: finance?.monthlySavingTarget ?? 0,
        remainingSavings: Math.max(
          (finance?.targetSavings ?? 0) - (finance?.currentSavings ?? 0),
          0,
        ),
      }),
      lifeSimulations: lifeSimulations.map((simulation) => ({
        ...simulation,
        result: calculateLifeSimulation(simulation),
      })),
      scenarios: scenarios.map((scenario) => calculateScenario(scenario)),
      career,
      skills,
      workMetrics: {
        totalIncome,
        independentIncome,
        independentIncomeRatio:
          totalIncome > 0 ? (independentIncome / totalIncome) * 100 : 0,
        companyDependency:
          totalIncome > 0
            ? ((totalIncome - independentIncome) / totalIncome) * 100
            : 100,
        freedomScore,
        runwayMonths,
        dailyLivingCost: currentLife?.dailyCost ?? null,
        fixedCostMonthlyReduction,
        fixedCostAnnualReduction: fixedCostMonthlyReduction * 12,
      },
      actions,
      achievements,
      visits,
      visitStats,
      memories,
      photos,
      reasons,
      bucket,
      nextVisit,
      randomNaoshima: randomPool[randomIndex] ?? null,
      lifeRatio: lifeRatio({
        birthDate: settings?.birthDate,
        islandDays: visitStats.totalDays,
      }),
      investments: { timeInvestmentMinutes, moneyInvestment },
      extras,
      sun: calculateNaoshimaSunTimes(),
    }
  },
)
