import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
  calculateScenario,
  calculateSavingForecast as calculateSavingForecastValue,
} from '#/services/finance.service'
import { calculateJourney } from '#/services/journey.service'
import { calculateReadiness } from '#/services/readiness.service'

import { coreRepository } from './core-repository.server'
import {
  addSkillXpSchema,
  careerConditionSchema,
  conditionInputSchema,
  createMissionSchema,
  financeSettingsSchema,
  idSchema,
  incomeSourceSchema,
  lifeSimulationSchema,
  reorderSchema,
  roadmapInputSchema,
  scenarioSchema,
  settingsSchema,
  sideIncomeGoalSchema,
  skillInputSchema,
  updateMissionSchema,
  savingInputSchema,
} from './validation'

export const getSettings = createServerFn({ method: 'GET' }).handler(() =>
  coreRepository().getSettings(),
)

export const updateSettings = createServerFn({ method: 'POST' })
  .validator(settingsSchema)
  .handler(({ data }) => coreRepository().saveSettings(data))

export const getConditions = createServerFn({ method: 'GET' }).handler(() =>
  coreRepository().listConditions(),
)

export const createCondition = createServerFn({ method: 'POST' })
  .validator(conditionInputSchema.omit({ id: true }))
  .handler(({ data }) => coreRepository().saveCondition(data))

export const updateCondition = createServerFn({ method: 'POST' })
  .validator(conditionInputSchema.required({ id: true }))
  .handler(({ data }) => coreRepository().saveCondition(data))

export const completeCondition = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().toggleCondition(data.id))

export const deleteCondition = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().deleteCondition(data.id))

export const getRoadmap = createServerFn({ method: 'GET' }).handler(() =>
  coreRepository().listRoadmap(),
)

export const createRoadmapItem = createServerFn({ method: 'POST' })
  .validator(roadmapInputSchema.omit({ id: true }))
  .handler(({ data }) => coreRepository().saveRoadmapItem(data))

export const updateRoadmapItem = createServerFn({ method: 'POST' })
  .validator(roadmapInputSchema.required({ id: true }))
  .handler(({ data }) => coreRepository().saveRoadmapItem(data))

export const deleteRoadmapItem = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().deleteRoadmapItem(data.id))

export const reorderRoadmapItems = createServerFn({ method: 'POST' })
  .validator(reorderSchema)
  .handler(({ data }) => coreRepository().reorderRoadmap(data.ids))

export const getJourney = createServerFn({ method: 'GET' }).handler(
  async () => {
    const repository = coreRepository()
    const [settings, totalXp, conditions, roadmap] = await Promise.all([
      repository.getSettings(),
      repository.totalXp(),
      repository.listConditions(),
      repository.listRoadmap(),
    ])
    return {
      settings,
      totalXp,
      journey: calculateJourney(
        totalXp,
        settings?.virtualJourneyDistance ?? 1000,
      ),
      readiness: calculateReadiness(conditions),
      conditions,
      roadmap,
    }
  },
)

export const getMissions = createServerFn({ method: 'GET' }).handler(() =>
  coreRepository().listMissions(),
)

export const createMission = createServerFn({ method: 'POST' })
  .validator(createMissionSchema)
  .handler(({ data }) => coreRepository().saveMission(data))

export const updateMission = createServerFn({ method: 'POST' })
  .validator(updateMissionSchema)
  .handler(({ data }) => coreRepository().saveMission(data))

export const deleteMission = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().deleteMission(data.id))

export const completeMission = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().completeMission(data.id))

export const uncompleteMission = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().uncompleteMission(data.id))

export const getFinance = createServerFn({ method: 'GET' }).handler(
  async () => {
    const repository = coreRepository()
    const [settings, transactions, simulations, scenarios] = await Promise.all([
      repository.getFinanceSettings(),
      repository.listSavings(),
      repository.listLifeSimulations(),
      repository.listScenarios(),
    ])
    const average = transactions
      .slice(0, 3)
      .reduce(
        (sum, transaction) =>
          sum +
          (transaction.type === 'DEPOSIT'
            ? transaction.amount
            : -transaction.amount),
        0,
      )
    return {
      settings,
      transactions,
      simulations,
      scenarios: scenarios.map((scenario) => calculateScenario(scenario)),
      forecast: settings
        ? calculateSavingForecastValue({
            currentSavings: settings.currentSavings,
            targetSavings: settings.targetSavings,
            averageMonthlySaving:
              transactions.length > 0
                ? average / Math.min(transactions.length, 3)
                : undefined,
            fallbackMonthlySaving: settings.monthlySavingTarget,
          })
        : null,
    }
  },
)

export const updateFinanceSettings = createServerFn({ method: 'POST' })
  .validator(financeSettingsSchema)
  .handler(({ data }) => coreRepository().saveFinanceSettings(data))

export const getSavingTransactions = createServerFn({ method: 'GET' }).handler(
  () => coreRepository().listSavings(),
)

export const createSavingTransaction = createServerFn({ method: 'POST' })
  .validator(savingInputSchema)
  .handler(({ data }) => coreRepository().createSaving(data))

export const deleteSavingTransaction = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().deleteSaving(data.id))

export const calculateSavingForecast = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      currentSavings: z.number().nonnegative(),
      targetSavings: z.number().positive(),
      averageMonthlySaving: z.number().optional(),
      fallbackMonthlySaving: z.number().nonnegative(),
      from: z.coerce.date().optional(),
    }),
  )
  .handler(({ data }) => calculateSavingForecastValue(data))

export const saveLifeSimulation = createServerFn({ method: 'POST' })
  .validator(lifeSimulationSchema)
  .handler(({ data }) => coreRepository().saveLifeSimulation(data))

export const getLifeSimulation = createServerFn({ method: 'GET' }).handler(() =>
  coreRepository().listLifeSimulations(),
)

export const saveMigrationScenario = createServerFn({ method: 'POST' })
  .validator(scenarioSchema)
  .handler(({ data }) => coreRepository().saveScenario(data))

export const getCareerConditions = createServerFn({ method: 'GET' }).handler(
  async () => (await coreRepository().listCareer()).conditions,
)

export const createCareerCondition = createServerFn({ method: 'POST' })
  .validator(careerConditionSchema.omit({ id: true }))
  .handler(({ data }) => coreRepository().saveCareerCondition(data))

export const updateCareerCondition = createServerFn({ method: 'POST' })
  .validator(careerConditionSchema.required({ id: true }))
  .handler(({ data }) => coreRepository().saveCareerCondition(data))

export const deleteCareerCondition = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) =>
    coreRepository().deleteCareerItem('condition', data.id),
  )

export const getIncomeSources = createServerFn({ method: 'GET' }).handler(
  async () => (await coreRepository().listCareer()).sources,
)

export const createIncomeSource = createServerFn({ method: 'POST' })
  .validator(incomeSourceSchema.omit({ id: true }))
  .handler(({ data }) => coreRepository().saveIncomeSource(data))

export const updateIncomeSource = createServerFn({ method: 'POST' })
  .validator(incomeSourceSchema.required({ id: true }))
  .handler(({ data }) => coreRepository().saveIncomeSource(data))

export const deleteIncomeSource = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().deleteCareerItem('income', data.id))

export const getSideIncomeGoals = createServerFn({ method: 'GET' }).handler(
  async () => (await coreRepository().listCareer()).goals,
)

export const createSideIncomeGoal = createServerFn({ method: 'POST' })
  .validator(sideIncomeGoalSchema.omit({ id: true }))
  .handler(({ data }) => coreRepository().saveSideIncomeGoal(data))

export const updateSideIncomeGoal = createServerFn({ method: 'POST' })
  .validator(sideIncomeGoalSchema.required({ id: true }))
  .handler(({ data }) => coreRepository().saveSideIncomeGoal(data))

export const deleteSideIncomeGoal = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().deleteCareerItem('goal', data.id))

export const getSkills = createServerFn({ method: 'GET' }).handler(() =>
  coreRepository().listSkills(),
)

export const createSkill = createServerFn({ method: 'POST' })
  .validator(skillInputSchema.omit({ id: true }))
  .handler(({ data }) => coreRepository().saveSkill(data))

export const updateSkill = createServerFn({ method: 'POST' })
  .validator(skillInputSchema.required({ id: true }))
  .handler(({ data }) => coreRepository().saveSkill(data))

export const deleteSkill = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().deleteSkill(data.id))

export const addSkillXp = createServerFn({ method: 'POST' })
  .validator(addSkillXpSchema)
  .handler(({ data }) => coreRepository().addSkillXp(data.id, data.amount))

export const getAchievements = createServerFn({ method: 'GET' }).handler(() =>
  coreRepository().listAchievements(),
)

export const checkAchievements = createServerFn({ method: 'POST' }).handler(
  async () => {
    const repository = coreRepository()
    const [
      { definitions, unlocked },
      missionsList,
      finance,
      totalXp,
      conditions,
    ] = await Promise.all([
      repository.listAchievements(),
      repository.listMissions(),
      repository.getFinanceSettings(),
      repository.totalXp(),
      repository.listConditions(),
    ])
    const readiness = calculateReadiness(conditions).overall
    const values: Record<string, number> = {
      MISSION_COUNT: missionsList.filter((mission) => mission.completed).length,
      TOTAL_XP: totalXp,
      SAVINGS: finance?.currentSavings ?? 0,
      JOURNEY: calculateJourney(totalXp).progressKm,
      READINESS: readiness,
    }
    const unlockedIds = new Set(unlocked.map((item) => item.achievementId))
    const newlyUnlocked = definitions.filter(
      (definition) =>
        !unlockedIds.has(definition.id) &&
        (values[definition.kind] ?? 0) >= definition.threshold,
    )
    await repository.unlockAchievementIds(
      newlyUnlocked.map((definition) => definition.id),
    )
    return newlyUnlocked
  },
)
